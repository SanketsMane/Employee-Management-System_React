const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ 
      'recipients.user': req.user._id,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'firstName lastName')
      .populate('recipients.user', 'firstName lastName');

    // Format notifications with user-specific read status
    const formattedNotifications = notifications.map(notification => {
      const userRecipient = notification.recipients.find(
        recipient => recipient.user._id.toString() === req.user._id.toString()
      );
      
      return {
        ...notification.toObject(),
        isRead: userRecipient?.isRead || false,
        readAt: userRecipient?.readAt
      };
    });

    const total = await Notification.countDocuments({ 
      'recipients.user': req.user._id,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      count: formattedNotifications.length,
      total,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      data: { notifications: formattedNotifications }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications',
      error: error.message
    });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      'recipients.user': req.user._id,
      'recipients.isRead': false,
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while getting unread count',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: req.params.id, 
        'recipients.user': req.user._id 
      },
      { 
        $set: { 
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 'recipients.user': req.user._id, 'recipients.isRead': false },
      { 
        $set: { 
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking all notifications as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      'recipients.user': req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Remove the user from recipients instead of deleting the entire notification
    notification.recipients = notification.recipients.filter(
      recipient => recipient.user.toString() !== req.user._id.toString()
    );

    if (notification.recipients.length === 0) {
      // Delete notification if no recipients left
      await Notification.findByIdAndDelete(req.params.id);
    } else {
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification',
      error: error.message
    });
  }
};

// Helper function to create notifications
exports.createNotification = async (senderId, recipients, title, message, type = 'info', priority = 'Medium', actionUrl = null, metadata = null) => {
  try {
    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? 
      recipients.map(userId => ({ user: userId, isRead: false })) :
      [{ user: recipients, isRead: false }];

    const notification = await Notification.create({
      title,
      message,
      type,
      sender: senderId,
      recipients: recipientList,
      priority,
      actionUrl,
      metadata
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// @desc    Send notification to users
// @route   POST /api/notifications/send
// @access  Private/Admin/HR/Manager/TeamLead
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, recipients, type = 'info', priority = 'Medium' } = req.body;

    // Check permissions
    if (!['Admin', 'HR', 'Manager', 'Team Lead'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    if (!title || !message || !recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and recipients are required'
      });
    }

    const notification = await this.createNotification(
      req.user.id,
      recipients,
      title,
      message,
      type,
      priority
    );

    await notification.populate('sender', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: `Notification sent to ${recipients.length} recipients`,
      data: notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message
    });
  }
};
