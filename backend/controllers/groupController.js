const Group = require('../models/Group');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private (Admin only)
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members, privacy } = req.body;
    const createdBy = req.user._id;

    // Only Admin can create groups
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create groups'
      });
    }

    // Validate members exist
    if (members && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } });
      if (validMembers.length !== members.length) {
        return res.status(400).json({
          success: false,
          message: 'Some members do not exist'
        });
      }
    }

    // Create the group
    const group = new Group({
      name,
      description,
      createdBy,
      privacy: privacy || 'private',
      members: members ? members.map(id => ({ user: id, role: 'member' })) : []
    });

    // Add creator as admin
    group.members.unshift({
      user: createdBy,
      role: 'admin'
    });

    await group.save();

    // Create associated chat
    const chat = new Chat({
      name: group.name,
      participants: [createdBy, ...(members || [])],
      isGroup: true,
      group: group._id,
      createdBy
    });

    await chat.save();
    group.chat = chat._id;
    await group.save();

    // Populate and return
    await group.populate('members.user', 'firstName lastName email profilePicture role');
    await group.populate('createdBy', 'firstName lastName profilePicture role');

    res.status(201).json({
      success: true,
      data: { group },
      message: 'Group created successfully'
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating group',
      error: error.message
    });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id,
      isActive: true
    })
    .populate('members.user', 'firstName lastName email profilePicture role')
    .populate('createdBy', 'firstName lastName profilePicture role')
    .sort({ lastActivity: -1 });

    res.status(200).json({
      success: true,
      data: { groups },
      message: `Found ${groups.length} groups`
    });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching groups',
      error: error.message
    });
  }
};

// @desc    Get group details
// @route   GET /api/groups/:groupId
// @access  Private
exports.getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members.user', 'firstName lastName email profilePicture role')
      .populate('createdBy', 'firstName lastName profilePicture role');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is member
    if (!group.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: { group }
    });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching group details',
      error: error.message
    });
  }
};

// @desc    Add members to group
// @route   POST /api/groups/:groupId/members
// @access  Private (Admin only)
exports.addGroupMembers = async (req, res) => {
  try {
    const { members } = req.body;
    
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only Admin or group creator can add members
    if (req.user.role !== 'Admin' && group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admins or group creators can add group members'
      });
    }

    // Validate members exist
    const validMembers = await User.find({ _id: { $in: members } });
    if (validMembers.length !== members.length) {
      return res.status(400).json({
        success: false,
        message: 'Some members do not exist'
      });
    }

    // Add new members
    const newMembers = [];
    for (const memberId of members) {
      if (!group.isMember(memberId)) {
        group.members.push({
          user: memberId,
          role: 'member'
        });
        newMembers.push(memberId);
      }
    }

    // Update group chat participants
    const groupChat = await Chat.findOne({ group: group._id });
    if (groupChat) {
      groupChat.participants = [...new Set([...groupChat.participants, ...newMembers])];
      await groupChat.save();
    }

    group.lastActivity = new Date();
    await group.save();
    await group.populate('members.user', 'firstName lastName email profilePicture role');

    // Send notifications to new members
    for (const memberId of newMembers) {
      await createNotification(
        memberId,
        'Group Membership',
        `You have been added to the group "${group.name}"`,
        'Medium',
        `/groups/${group._id}`
      );
    }

    res.status(200).json({
      success: true,
      data: { group },
      message: `${newMembers.length} members added successfully`
    });
  } catch (error) {
    console.error('Add group members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding group members',
      error: error.message
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:userId
// @access  Private (Admin only)
exports.removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group || !group.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if requester is admin of the group or system admin
    if (req.user.role !== 'Admin' && !group.isGroupAdmin(adminId)) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can remove members'
      });
    }

    // Check if user is actually a member
    if (!group.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this group'
      });
    }

    // Cannot remove the group creator
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the group creator'
      });
    }

    // Remove member from group
    group.members = group.members.filter(member => member.user.toString() !== userId);

    // Update group chat participants
    const groupChat = await Chat.findOne({ group: group._id });
    if (groupChat) {
      groupChat.participants = groupChat.participants.filter(
        participant => participant.toString() !== userId
      );
      await groupChat.save();
    }

    group.lastActivity = new Date();
    await group.save();
    await group.populate('members.user', 'firstName lastName email profilePicture role');

    // Send notification to removed user
    await createNotification(
      userId,
      'Group Membership',
      `You have been removed from the group "${group.name}"`,
      'Medium',
      `/groups`
    );

    res.status(200).json({
      success: true,
      data: { group },
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove group member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing group member',
      error: error.message
    });
  }
};

// @desc    Update group settings
// @route   PUT /api/groups/:groupId/settings
// @access  Private (Admin only)
exports.updateGroupSettings = async (req, res) => {
  try {
    const { name, description, privacy } = req.body;
    
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only Admin or group creator can update settings
    if (req.user.role !== 'Admin' && group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admins or group creators can update group settings'
      });
    }

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (privacy) group.privacy = privacy;
    
    group.lastActivity = new Date();
    await group.save();
    await group.populate('members.user', 'firstName lastName email profilePicture role');

    res.status(200).json({
      success: true,
      data: { group },
      message: 'Group settings updated successfully'
    });
  } catch (error) {
    console.error('Update group settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating group settings',
      error: error.message
    });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:groupId
// @access  Private (Admin only)
exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Only Admin or group creator can delete
    if (req.user.role !== 'Admin' && group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admins or group creators can delete groups'
      });
    }

    // Mark as inactive instead of deleting
    group.isActive = false;
    group.lastActivity = new Date();
    await group.save();

    // Also mark associated chat as inactive
    await Chat.findOneAndUpdate(
      { group: group._id },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting group',
      error: error.message
    });
  }
};
