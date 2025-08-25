const express = require('express');
const {
  createTeam,
  getTeams,
  getTeam,
  addTeamMember,
  removeTeamMember,
  getAvailableEmployees,
  sendTeamNotification
} = require('../controllers/teamController');
const { protect, authorize } = require('../utils/roleMiddleware');

const router = express.Router();

// Protect all routes
router.use(protect);

// Team management routes
router.route('/')
  .get(getTeams)
  .post(authorize('Admin', 'Manager'), createTeam);

router.get('/available-employees', authorize('Admin', 'HR', 'Manager', 'Team Lead'), getAvailableEmployees);

router.route('/:id')
  .get(getTeam);

router.route('/:id/members')
  .post(authorize('Admin', 'HR', 'Manager', 'Team Lead'), addTeamMember);

router.route('/:id/members/:userId')
  .delete(authorize('Admin', 'HR', 'Manager', 'Team Lead'), removeTeamMember);

router.post('/:id/notify', authorize('Admin', 'HR', 'Manager', 'Team Lead'), sendTeamNotification);

module.exports = router;
