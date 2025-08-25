const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new team
// @route   POST /api/teams
// @access  Private/Admin/Manager
exports.createTeam = async (req, res) => {
  try {
    const { name, description, teamLeadId, department } = req.body;

    // Verify team lead exists and has correct role
    const teamLead = await User.findById(teamLeadId);
    if (!teamLead || teamLead.role !== 'Team Lead') {
      return res.status(400).json({
        success: false,
        message: 'Invalid team lead selected'
      });
    }

    const team = await Team.create({
      name,
      description,
      teamLead: teamLeadId,
      department,
      createdBy: req.user.id
    });

    await team.populate('teamLead', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: team
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: error.message
    });
  }
};

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    let query = { isActive: true };

    // If user is Team Lead, only show their team
    if (req.user.role === 'Team Lead') {
      query.teamLead = req.user.id;
    }

    const teams = await Team.find(query)
      .populate('teamLead', 'firstName lastName email')
      .populate('members', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('teamLead', 'firstName lastName email phone')
      .populate('members', 'firstName lastName email role department position')
      .populate('createdBy', 'firstName lastName');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team',
      error: error.message
    });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private/TeamLead/Admin/Manager
exports.addTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user can add members to this team
    if (req.user.role === 'Team Lead' && team.teamLead.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only add members to your own team'
      });
    }

    const user = await User.findById(userId);
    if (!user || !user.isApproved || !user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user or user not approved'
      });
    }

    // Check if user is already in the team
    if (team.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member'
      });
    }

    // Add member to team
    team.members.push(userId);
    await team.save();

    // Update user's team reference
    user.team = teamId;
    await user.save();

    // Create notification for the new team member
    await Notification.create({
      title: 'Added to Team',
      message: `You have been added to the team "${team.name}" by ${req.user.firstName} ${req.user.lastName}`,
      type: 'info',
      sender: req.user.id,
      recipients: [{
        user: userId,
        isRead: false
      }],
      priority: 'Medium',
      category: 'team'
    });

    await team.populate('members', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      data: team
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding team member',
      error: error.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private/TeamLead/Admin/Manager
exports.removeTeamMember = async (req, res) => {
  try {
    const { id: teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user can remove members from this team
    if (req.user.role === 'Team Lead' && team.teamLead.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove members from your own team'
      });
    }

    // Remove member from team
    team.members = team.members.filter(member => member.toString() !== userId);
    await team.save();

    // Update user's team reference
    await User.findByIdAndUpdate(userId, { $unset: { team: 1 } });

    // Create notification for the removed team member
    const removedUser = await User.findById(userId);
    if (removedUser) {
      await Notification.create({
        title: 'Removed from Team',
        message: `You have been removed from the team "${team.name}" by ${req.user.firstName} ${req.user.lastName}`,
        type: 'warning',
        sender: req.user.id,
        recipients: [{
          user: userId,
          isRead: false
        }],
        priority: 'Medium',
        category: 'team'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing team member',
      error: error.message
    });
  }
};

// @desc    Get available employees for team
// @route   GET /api/teams/available-employees
// @access  Private/TeamLead/Admin/Manager
exports.getAvailableEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      isApproved: true,
      isActive: true,
      role: { $in: ['Employee', 'Software developer trainee', 'Associate software developer', 'Full stack developer', 'Dot net developer', 'UI UX designer', 'Flutter developer', 'React native developer', 'Java developer'] },
      team: { $exists: false }
    }).select('firstName lastName email role department position');

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    console.error('Get available employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available employees',
      error: error.message
    });
  }
};

// @desc    Send notification to team members
// @route   POST /api/teams/:id/notify
// @access  Private/TeamLead/Admin/Manager
exports.sendTeamNotification = async (req, res) => {
  try {
    const { title, message, priority = 'Medium' } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user can send notifications to this team
    if (req.user.role === 'Team Lead' && team.teamLead.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only send notifications to your own team'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // Prepare recipients
    const recipients = team.members.map(member => ({
      user: member._id,
      isRead: false
    }));

    // Create notification
    await Notification.create({
      title,
      message,
      type: 'info',
      sender: req.user.id,
      recipients,
      priority,
      category: 'team'
    });

    res.status(200).json({
      success: true,
      message: `Notification sent to ${recipients.length} team members`,
      data: {
        recipients: recipients.length,
        teamName: team.name
      }
    });
  } catch (error) {
    console.error('Send team notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending team notification',
      error: error.message
    });
  }
};
