const BugReport = require('../models/BugReport');
const User = require('../models/User');
const webSocketService = require('../services/websocket');
const cloudinary = require('../config/cloudinary');

// Create a new bug report
const createBugReport = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      stepsToReproduce,
      browserInfo
    } = req.body;

    const bugReport = new BugReport({
      title,
      description,
      priority,
      category,
      stepsToReproduce,
      browserInfo,
      reportedBy: req.user._id
    });

    await bugReport.save();
    await bugReport.populate('reportedBy', 'firstName lastName email role');

    // Notify all admins about the new bug report
    const admins = await User.find({ role: 'Admin' });
    const notification = {
      _id: new Date().getTime(),
      type: 'bug_report',
      title: 'New Bug Report',
      message: `${bugReport.reportedBy.firstName} ${bugReport.reportedBy.lastName} reported a ${priority} priority bug: "${title}"`,
      data: {
        bugReportId: bugReport._id,
        priority: priority,
        reportedBy: `${bugReport.reportedBy.firstName} ${bugReport.reportedBy.lastName}`
      },
      createdAt: new Date(),
      read: false
    };

    // Send real-time notification to all admins
    admins.forEach(admin => {
      webSocketService.sendNotificationToUser(admin._id.toString(), notification);
    });

    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully',
      data: bugReport
    });
  } catch (error) {
    console.error('Error creating bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bug report',
      error: error.message
    });
  }
};

// Get all bug reports (Admin only)
const getAllBugReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const bugReports = await BugReport.find(filter)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BugReport.countDocuments(filter);

    // Get status summary
    const statusSummary = await BugReport.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const prioritySummary = await BugReport.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        bugReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: {
          status: statusSummary,
          priority: prioritySummary
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug reports',
      error: error.message
    });
  }
};

// Get user's own bug reports
const getUserBugReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { reportedBy: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const bugReports = await BugReport.find(filter)
      .populate('assignedTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BugReport.countDocuments(filter);

    res.json({
      success: true,
      data: {
        bugReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user bug reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug reports',
      error: error.message
    });
  }
};

// Get bugs assigned to current user
const getAssignedBugReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const bugReports = await BugReport.find(filter)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('resolvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BugReport.countDocuments(filter);

    // Get status summary for assigned bugs
    const statusSummary = await BugReport.aggregate([
      { $match: { assignedTo: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        bugReports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: {
          status: statusSummary
        }
      }
    });
  } catch (error) {
    console.error('Error fetching assigned bug reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned bug reports',
      error: error.message
    });
  }
};

// Update assigned bug report (for employees working on assigned bugs)
const updateAssignedBugReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, workNotes, estimatedTimeHours } = req.body;

    const bugReport = await BugReport.findById(id)
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    // Check if user is assigned to this bug report
    if (bugReport.assignedTo?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update bugs assigned to you'
      });
    }

    // Validate status transitions
    const allowedStatuses = ['in-progress', 'resolved', 'needs-more-info'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed statuses: in-progress, resolved, needs-more-info'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (resolution) updateData.resolution = resolution;
    if (workNotes) updateData.workNotes = workNotes;
    if (estimatedTimeHours) updateData.estimatedTimeHours = estimatedTimeHours;
    
    // Add work log entry
    if (!bugReport.workLog) bugReport.workLog = [];
    bugReport.workLog.push({
      action: status || 'update',
      notes: workNotes || resolution || 'Status updated',
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const updatedBugReport = await BugReport.findByIdAndUpdate(
      id,
      { ...updateData, workLog: bugReport.workLog },
      { new: true }
    ).populate('reportedBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email')
     .populate('resolvedBy', 'firstName lastName email');

    // Notify the bug reporter and admins about the update
    const notification = {
      _id: new Date().getTime(),
      type: 'bug_update',
      title: 'Bug Report Updated',
      message: `Bug "${bugReport.title}" has been updated by ${req.user.firstName} ${req.user.lastName}`,
      data: {
        bugReportId: bugReport._id,
        status: status,
        updatedBy: `${req.user.firstName} ${req.user.lastName}`
      },
      createdAt: new Date(),
      read: false
    };

    // Send notification to bug reporter
    webSocketService.sendNotificationToUser(
      bugReport.reportedBy._id.toString(), 
      notification
    );

    // Send notification to all admins
    const admins = await User.find({ role: 'Admin' });
    admins.forEach(admin => {
      webSocketService.sendNotificationToUser(admin._id.toString(), notification);
    });

    res.json({
      success: true,
      message: 'Bug report updated successfully',
      data: updatedBugReport
    });
  } catch (error) {
    console.error('Error updating assigned bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bug report',
      error: error.message
    });
  }
};

// Update bug report status (Admin only)
const updateBugReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, adminNotes, resolution } = req.body;

    const bugReport = await BugReport.findById(id)
      .populate('reportedBy', 'firstName lastName email');

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    const updateData = { status };
    
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (resolution) updateData.resolution = resolution;
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const updatedBugReport = await BugReport.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('reportedBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email')
     .populate('resolvedBy', 'firstName lastName email');

    // Notify the user who reported the bug about the status update
    const notification = {
      _id: new Date().getTime(),
      type: 'bug_update',
      title: 'Bug Report Updated',
      message: `Your bug report "${bugReport.title}" has been updated to ${status}`,
      data: {
        bugReportId: bugReport._id,
        status: status,
        updatedBy: `${req.user.firstName} ${req.user.lastName}`
      },
      createdAt: new Date(),
      read: false
    };

    // Send real-time notification to the bug reporter
    webSocketService.sendNotificationToUser(
      bugReport.reportedBy._id.toString(), 
      notification
    );

    res.json({
      success: true,
      message: 'Bug report updated successfully',
      data: updatedBugReport
    });
  } catch (error) {
    console.error('Error updating bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bug report',
      error: error.message
    });
  }
};

// Get bug report by ID
const getBugReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const bugReport = await BugReport.findById(id)
      .populate('reportedBy', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email');

    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    // Check if user has permission to view this bug report
    if (req.user.role !== 'Admin' && bugReport.reportedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: bugReport
    });
  } catch (error) {
    console.error('Error fetching bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bug report',
      error: error.message
    });
  }
};

// Upload screenshot for bug report
const uploadScreenshot = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const bugReport = await BugReport.findById(id);
    
    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    // Check if user has permission to upload to this bug report
    if (req.user.role !== 'Admin' && bugReport.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'bug-reports',
      resource_type: 'image'
    });

    // Add screenshot to bug report
    bugReport.screenshots.push({
      url: result.secure_url,
      publicId: result.public_id
    });

    await bugReport.save();

    res.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    });
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload screenshot',
      error: error.message
    });
  }
};

// Delete bug report (Admin only)
const deleteBugReport = async (req, res) => {
  try {
    const { id } = req.params;

    const bugReport = await BugReport.findById(id);
    
    if (!bugReport) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    // Delete screenshots from Cloudinary
    if (bugReport.screenshots.length > 0) {
      const deletePromises = bugReport.screenshots.map(screenshot => 
        cloudinary.uploader.destroy(screenshot.publicId)
      );
      await Promise.all(deletePromises);
    }

    await BugReport.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bug report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bug report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bug report',
      error: error.message
    });
  }
};

module.exports = {
  createBugReport,
  getAllBugReports,
  getUserBugReports,
  getAssignedBugReports,
  updateBugReportStatus,
  updateAssignedBugReport,
  getBugReportById,
  uploadScreenshot,
  deleteBugReport
};
