const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');
const webSocketService = require('../services/websocket');
const cloudinary = require('../config/cloudinary');

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (Admin, HR)
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      targetType,
      targetRoles,
      targetDepartments,
      targetUsers,
      scheduledAt,
      expiresAt,
      requiresAcknowledgment,
      sendEmail: shouldSendEmail,
      tags
    } = req.body;

    // Create announcement
    const announcement = new Announcement({
      title,
      content,
      type,
      priority,
      targetType,
      targetRoles: targetRoles || [],
      targetDepartments: targetDepartments || [],
      targetUsers: targetUsers || [],
      createdBy: req.user._id,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      requiresAcknowledgment: requiresAcknowledgment || false,
      sendEmail: shouldSendEmail !== false,
      tags: tags || []
    });

    await announcement.save();
    await announcement.populate('createdBy', 'firstName lastName email');

    // Get target users
    const targetUsers_resolved = await getTargetUsers(announcement);
    
    // Send real-time notifications
    await sendRealTimeNotifications(announcement, targetUsers_resolved);
    
    // Send email notifications if enabled
    if (announcement.sendEmail) {
      await sendEmailNotifications(announcement, targetUsers_resolved);
    }

    // Create database notifications
    await createDatabaseNotifications(announcement, targetUsers_resolved);

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message
    });
  }
};

// @desc    Get all announcements (Admin view)
// @route   GET /api/announcements/admin
// @access  Private (Admin, HR)
const getAllAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      targetType,
      isActive,
      search
    } = req.query;

    const filter = {};
    
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (targetType) filter.targetType = targetType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('targetUsers', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);

    // Get statistics
    const stats = await Announcement.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          requiresAck: { $sum: { $cond: ['$requiresAcknowledgment', 1, 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: stats[0] || { total: 0, active: 0, urgent: 0, requiresAck: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// @desc    Get announcements for current user
// @route   GET /api/announcements
// @access  Private
const getUserAnnouncements = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      status,
      search,
      unreadOnly = false
    } = req.query;

    const filter = {
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } }
      ]
    };
    
    if (type && type !== 'all') filter.type = type;
    if (priority && priority !== 'all') filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Build targeting filter to match the user before pagination
    const userRole = req.user.role;
    const userDepartment = req.user.department;
    const userId = req.user._id;

    const targetingFilter = {
      $or: [
        { targetType: 'all' },
        { targetType: 'role', targetRoles: userRole },
        { targetType: 'department', targetDepartments: userDepartment },
        { targetType: 'specific', targetUsers: userId }
      ]
    };

    // Combine filters
    const combinedFilter = { ...filter, ...targetingFilter };

    const skip = (page - 1) * limit;
    
    // Get announcements that target the current user
    let announcements = await Announcement.find(combinedFilter)
      .populate('createdBy', 'firstName lastName email role')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Announcement.countDocuments(combinedFilter);

    // Filter unread if requested
    if (unreadOnly === 'true') {
      announcements = announcements.filter(announcement => 
        !announcement.readBy.some(read => read.user.toString() === req.user._id.toString())
      );
    }

    // Add read status and acknowledgment status for each announcement
    const announcementsWithStatus = announcements.map(announcement => {
      const isRead = announcement.readBy.some(read => 
        read.user.toString() === req.user._id.toString()
      );
      const isAcknowledged = announcement.acknowledgedBy.some(ack => 
        ack.user.toString() === req.user._id.toString()
      );

      const readEntry = announcement.readBy.find(read => 
        read.user.toString() === req.user._id.toString()
      );
      const ackEntry = announcement.acknowledgedBy.find(ack => 
        ack.user.toString() === req.user._id.toString()
      );

      return {
        ...announcement.toObject(),
        isRead,
        isAcknowledged,
        readAt: readEntry?.readAt,
        acknowledgedAt: ackEntry?.acknowledgedAt,
        needsAcknowledgment: announcement.requiresAcknowledgment && !isAcknowledged
      };
    });

    // Get stats for the current user
    const allUserAnnouncements = await Announcement.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } }
      ],
      ...targetingFilter
    });

    const unreadCount = allUserAnnouncements.filter(announcement => 
      !announcement.readBy.some(read => read.user.toString() === req.user._id.toString())
    ).length;

    const pendingAckCount = allUserAnnouncements.filter(announcement => 
      announcement.requiresAcknowledgment && 
      !announcement.acknowledgedBy.some(ack => ack.user.toString() === req.user._id.toString())
    ).length;

    const urgentCount = allUserAnnouncements.filter(announcement => 
      announcement.priority === 'critical' || announcement.priority === 'high' || announcement.type === 'urgent'
    ).length;

    // Apply status filter after getting stats
    let finalAnnouncements = announcementsWithStatus;
    if (status && status !== 'all') {
      switch (status) {
        case 'unread':
          finalAnnouncements = announcementsWithStatus.filter(ann => !ann.isRead);
          break;
        case 'read':
          finalAnnouncements = announcementsWithStatus.filter(ann => ann.isRead);
          break;
        case 'acknowledged':
          finalAnnouncements = announcementsWithStatus.filter(ann => ann.isAcknowledged);
          break;
        case 'pending_ack':
          finalAnnouncements = announcementsWithStatus.filter(ann => ann.needsAcknowledgment);
          break;
      }
    }

    res.json({
      success: true,
      data: {
        announcements: finalAnnouncements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        stats: {
          total: allUserAnnouncements.length,
          unread: unreadCount,
          pendingAck: pendingAckCount,
          urgent: urgentCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message
    });
  }
};

// @desc    Get announcement by ID
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'firstName lastName email role')
      .populate('targetUsers', 'firstName lastName email')
      .populate('readBy.user', 'firstName lastName email')
      .populate('acknowledgedBy.user', 'firstName lastName email');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user has access to this announcement
    const hasAccess = req.user.role === 'Admin' || 
                     req.user.role === 'HR' || 
                     announcement.isTargetedToUser(req.user);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark as read if not admin/HR viewing
    if (req.user.role !== 'Admin' && req.user.role !== 'HR') {
      await announcement.markAsRead(req.user._id);
    }

    const isRead = announcement.readBy.some(read => 
      read.user._id.toString() === req.user._id.toString()
    );
    const isAcknowledged = announcement.acknowledgedBy.some(ack => 
      ack.user._id.toString() === req.user._id.toString()
    );

    res.json({
      success: true,
      data: {
        ...announcement.toObject(),
        isRead,
        isAcknowledged,
        needsAcknowledgment: announcement.requiresAcknowledgment && !isAcknowledged
      }
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message
    });
  }
};

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is targeted by this announcement
    if (!announcement.isTargetedToUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await announcement.markAsRead(req.user._id);

    res.json({
      success: true,
      message: 'Announcement marked as read'
    });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as read',
      error: error.message
    });
  }
};

// @desc    Acknowledge announcement
// @route   POST /api/announcements/:id/acknowledge
// @access  Private
const acknowledgeAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Check if user is targeted by this announcement
    if (!announcement.isTargetedToUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!announcement.requiresAcknowledgment) {
      return res.status(400).json({
        success: false,
        message: 'This announcement does not require acknowledgment'
      });
    }

    await announcement.markAsAcknowledged(req.user._id);

    res.json({
      success: true,
      message: 'Announcement acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge announcement',
      error: error.message
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private (Admin, HR)
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        announcement[key] = updates[key];
      }
    });

    await announcement.save();
    await announcement.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: error.message
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin, HR)
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    // Delete attachments from cloudinary
    if (announcement.attachments.length > 0) {
      const deletePromises = announcement.attachments.map(attachment => 
        cloudinary.uploader.destroy(attachment.publicId)
      );
      await Promise.all(deletePromises);
    }

    await Announcement.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message
    });
  }
};

// Helper function to get target users based on announcement targeting
const getTargetUsers = async (announcement) => {
  let targetUsers = [];

  if (announcement.targetType === 'all') {
    targetUsers = await User.find({ isActive: true }).select('_id firstName lastName email role department');
  } else if (announcement.targetType === 'role') {
    targetUsers = await User.find({ 
      isActive: true, 
      role: { $in: announcement.targetRoles } 
    }).select('_id firstName lastName email role department');
  } else if (announcement.targetType === 'department') {
    targetUsers = await User.find({ 
      isActive: true, 
      department: { $in: announcement.targetDepartments } 
    }).select('_id firstName lastName email role department');
  } else if (announcement.targetType === 'specific') {
    targetUsers = await User.find({ 
      _id: { $in: announcement.targetUsers },
      isActive: true 
    }).select('_id firstName lastName email role department');
  }

  return targetUsers;
};

// Helper function to send real-time notifications
const sendRealTimeNotifications = async (announcement, targetUsers) => {
  const notification = {
    _id: new Date().getTime(),
    type: 'announcement',
    title: announcement.title,
    message: announcement.content.substring(0, 100) + (announcement.content.length > 100 ? '...' : ''),
    data: {
      announcementId: announcement._id,
      priority: announcement.priority,
      type: announcement.type,
      requiresAcknowledgment: announcement.requiresAcknowledgment
    },
    createdAt: new Date(),
    read: false
  };

  // Send to all target users
  targetUsers.forEach(user => {
    webSocketService.sendNotificationToUser(user._id.toString(), notification);
  });
};

// Helper function to send email notifications
const sendEmailNotifications = async (announcement, targetUsers) => {
  const emailPromises = targetUsers.map(user => {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 10px;">${announcement.title}</h2>
          <div style="background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin-bottom: 15px;"><strong>Priority:</strong> 
              <span style="background-color: ${
                announcement.priority === 'critical' ? '#dc3545' :
                announcement.priority === 'high' ? '#fd7e14' :
                announcement.priority === 'medium' ? '#ffc107' : '#28a745'
              }; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px;">
                ${announcement.priority.toUpperCase()}
              </span>
            </p>
            <div style="white-space: pre-wrap; line-height: 1.6;">${announcement.content}</div>
            ${announcement.requiresAcknowledgment ? 
              '<p style="margin-top: 20px; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107;"><strong>Action Required:</strong> This announcement requires your acknowledgment. Please log in to the system to acknowledge.</p>' 
              : ''
            }
          </div>
          <p style="color: #666; font-size: 14px;">
            Sent by: ${announcement.createdBy.firstName} ${announcement.createdBy.lastName}<br>
            Date: ${new Date(announcement.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    `;

    return sendEmail({
      to: user.email,
      subject: `📢 ${announcement.title}`,
      html: emailContent
    }).catch(error => {
      console.error(`Failed to send email to ${user.email}:`, error);
    });
  });

  await Promise.allSettled(emailPromises);
  
  // Update announcement to mark email as sent
  announcement.emailSentAt = new Date();
  await announcement.save();
};

// Helper function to create database notifications
const createDatabaseNotifications = async (announcement, targetUsers) => {
  const notificationPromises = targetUsers.map(user => {
    const notification = new Notification({
      recipient: user._id,
      type: 'announcement',
      title: announcement.title,
      message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
      data: {
        announcementId: announcement._id,
        priority: announcement.priority,
        requiresAcknowledgment: announcement.requiresAcknowledgment
      },
      priority: announcement.priority === 'critical' ? 'high' : 'medium'
    });

    return notification.save().catch(error => {
      console.error(`Failed to create notification for user ${user._id}:`, error);
    });
  });

  await Promise.allSettled(notificationPromises);
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getUserAnnouncements,
  getAnnouncementById,
  markAsRead,
  acknowledgeAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
