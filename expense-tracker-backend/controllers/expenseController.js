const Expense = require('../models/expense.model.js');
const Project = require('../models/project.model.js');
const { getDefaultTemplate } = require('../utils/initialTemplate');

exports.getExpenseTemplateForDate = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { date } = req.query;
        const userId = req.auth.userId;

        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const existingExpenses = await Expense.find({
            projectId: projectId,
            userId: userId,
            expenseDate: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingExpenses.length > 0) {
            return res.status(200).json(existingExpenses);
        }

        const latestEntry = await Expense.findOne({
            projectId: projectId,
            userId: userId,
            expenseDate: { $lt: startOfDay }
        }).sort({ expenseDate: -1 });

        if (latestEntry) {
            const latestDate = latestEntry.expenseDate;
            const latestDateStart = new Date(latestDate).setHours(0, 0, 0, 0);
            const latestDateEnd = new Date(latestDate).setHours(23, 59, 59, 999);
            
            const latestDayStructure = await Expense.find({
                projectId: projectId,
                userId: userId,
                expenseDate: { $gte: latestDateStart, $lte: latestDateEnd }
            });
            
            // --- FIX 2: Correct template generation logic ---
            // The goal is to keep the item structure, but clear all financial values for the new day.
            // The original logic incorrectly kept old prices for non-advance categories.
            const newTemplate = latestDayStructure.map(item => ({
                category: item.category,
                itemName: item.itemName,
                price: '', // Always clear price for a new day
                count: '', // Always clear count
                other: '', // Always clear other fields
                total: 0,
            }));
            
            return res.status(200).json(newTemplate);
        }

        const defaultTemplate = getDefaultTemplate();
        res.status(200).json(defaultTemplate);

    } catch (error) {
        console.error('Error fetching expense template:', error);
        res.status(500).json({ message: 'Server error while fetching expense template.' });
    }
};

exports.getProjectExpensesByDateRange = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.auth.userId;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide both a start and end date.' });
    }
    
    // This validation was added in payments.js, good practice to have it here too.
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid Project ID.' });
    }

    const project = await Project.findOne({ _id: projectId, userId: userId });
    if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
    }

    const expenses = await Expense.find({
      projectId: projectId,
      userId: userId,
      expenseDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ expenseDate: 'asc' });

    res.status(200).json(expenses);

  } catch (error) {
    console.error('Error fetching expenses by date range:', error);
    res.status(500).json({ message: 'Server error while fetching expenses.' });
  }
};