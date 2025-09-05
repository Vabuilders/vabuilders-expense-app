const express = require('express');
const router = express.Router();

// We will create this controller function in the next step
const { getProjectExpensesByDateRange } = require('../controllers/expenseController');

// Define the new GET route
// It will handle requests like: GET /api/projects/60c72b2f9b1d8c001f8e4c6a/expenses?startDate=...&endDate=...
router.get('/:projectId/expenses', getProjectExpensesByDateRange);

// You might have other project-related routes here
// For example: router.get('/:projectId', getProjectDetails);

module.exports = router;