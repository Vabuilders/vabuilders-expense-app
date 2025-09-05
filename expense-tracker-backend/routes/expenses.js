const express = require('express');
const router = express.Router();
const Expense = require('../models/expense.model.js');
const Project = require('../models/project.model.js');
const { getExpenseTemplateForDate } = require('../controllers/expenseController');

router.get('/template/:projectId', getExpenseTemplateForDate);

router.route('/save').post(async (req, res) => {
  const { projectId, date, expenses } = req.body;
  const userId = req.auth.userId;

  if (!projectId || !date) {
    return res.status(400).json('Project ID and date are required.');
  }

  try {
    const project = await Project.findOne({ _id: projectId, userId: userId });
    if (!project) {
        return res.status(403).json({ message: 'Access denied to this project.' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    await Expense.deleteMany({
      projectId: projectId,
      userId: userId,
      expenseDate: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const advanceCategories = [
        'Advances Given (Reminders)', 'Staff Salaries', 'Food and Snacks', 
        'Personal Expenses', 'Other Miscellaneous Expenses'
    ];

    const newExpensesToSave = expenses.map(exp => {
      const price = parseFloat(exp.price) || 0;
      let total = 0;

      if (advanceCategories.includes(exp.category)) {
        total = price;
      } else {
        const count = parseFloat(exp.count) || 0;
        const otherValue = parseFloat(exp.other) || 0;
        total = (price * count) + otherValue;
      }
      
      return {
        ...exp,
        userId: userId,
        projectId: projectId,
        expenseDate: startOfDay,
        total: total,
      }
    });

    if (newExpensesToSave.length > 0) {
      await Expense.insertMany(newExpensesToSave);
    }
    
    res.json('Expenses for the day saved successfully!');

  } catch (err) {
    console.error("Error saving expenses:", err);
    res.status(400).json('Error: ' + err.message);
  }
});

module.exports = router;