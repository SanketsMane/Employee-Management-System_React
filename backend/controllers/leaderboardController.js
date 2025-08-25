const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WorkSheet = require('../models/WorkSheet');

// @desc    Get leaderboard data
// @route   GET /api/analytics/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    // Calculate user scores based on attendance, worksheets, and other metrics
    const users = await User.find({ isActive: true })
      .select('fullName firstName lastName department role')
      .lean();

    const leaderboardData = [];

    for (const user of users) {
      // Calculate attendance score
      const attendanceCount = await Attendance.countDocuments({
        user: user._id,
        clockIn: { $exists: true },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      // Calculate worksheet score
      const worksheetCount = await WorkSheet.countDocuments({
        user: user._id,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      // Simple scoring algorithm
      const attendanceScore = attendanceCount * 10; // 10 points per attendance
      const worksheetScore = worksheetCount * 15; // 15 points per worksheet
      const totalScore = attendanceScore + worksheetScore;

      if (totalScore > 0) {
        leaderboardData.push({
          id: user._id,
          name: user.fullName || `${user.firstName} ${user.lastName}`,
          department: user.department || 'Not specified',
          role: user.role,
          score: totalScore,
          avatar: user.fullName ? user.fullName.charAt(0).toUpperCase() : '👤',
          badges: totalScore > 100 ? ['Active Employee'] : []
        });
      }
    }

    // Sort by score and add ranks
    leaderboardData.sort((a, b) => b.score - a.score);
    leaderboardData.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Calculate metrics
    const totalParticipants = leaderboardData.length;
    const averageScore = totalParticipants > 0 
      ? Math.round(leaderboardData.reduce((sum, user) => sum + user.score, 0) / totalParticipants)
      : 0;

    // Find top department
    const departmentScores = {};
    leaderboardData.forEach(user => {
      if (!departmentScores[user.department]) {
        departmentScores[user.department] = 0;
      }
      departmentScores[user.department] += user.score;
    });

    const topDepartment = Object.keys(departmentScores).length > 0
      ? Object.keys(departmentScores).reduce((a, b) => 
          departmentScores[a] > departmentScores[b] ? a : b
        )
      : 'N/A';

    const responseData = {
      overall: leaderboardData,
      monthly: leaderboardData.slice(0, 10), // Top 10 for monthly
      departmental: leaderboardData.slice(0, 15), // Top 15 for departmental
      metrics: {
        totalParticipants,
        averageScore,
        topDepartment,
        improvementRate: '+5%' // This would need historical data to calculate properly
      }
    };

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard data'
    });
  }
};
