const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { getProjectExpensesByDateRange } = require('../controllers/expenseController');
const Project = require('../models/project.model.js');
const Expense = require('../models/expense.model.js');
const Payment = require('../models/payment.model.js');

router.get('/', async (req, res) => {
    try {
        const projects = await Project.aggregate([
            { $match: { userId: req.auth.userId } },
            {
                $lookup: {
                    from: 'expenses',
                    let: { projectId: "$_id" },
                    pipeline: [
                        { $match: { 
                            $expr: { $eq: ["$projectId", "$$projectId"] },
                            userId: req.auth.userId
                        }}
                    ],
                    as: 'expenseDetails'
                }
            },
            { $addFields: { expenses: { $sum: '$expenseDetails.total' } } },
            { $project: { expenseDetails: 0 } }
        ]);
        res.json(projects);
    } catch (err) {
        console.error("Error fetching all projects with expenses:", err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

router.get('/:projectId', async (req, res) => {
    try {
        const projectId = new mongoose.Types.ObjectId(req.params.projectId);
        const projectResult = await Project.aggregate([
            { $match: { _id: projectId, userId: req.auth.userId } },
            {
                $lookup: {
                    from: 'expenses',
                    let: { projectId: "$_id" },
                    pipeline: [
                        { $match: { 
                            $expr: { $eq: ["$projectId", "$$projectId"] },
                            userId: req.auth.userId
                        }}
                    ],
                    as: 'expenseDetails'
                }
            },
            { $addFields: { expenses: { $sum: '$expenseDetails.total' } } },
            { $project: { expenseDetails: 0 } }
        ]);

        if (!projectResult || projectResult.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(projectResult[0]);
    } catch (err) {
        console.error(`Error fetching single project (${req.params.projectId}) with expenses:`, err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { projectName, totalBudget } = req.body;
        const newProject = new Project({
            userId: req.auth.userId,
            projectName,
            totalBudget: Number(totalBudget),
            ownerPaid: 0,
        });
        await newProject.save();
        res.status(201).json('Project added!');
    } catch (err) {
        res.status(400).json({ message: 'Error adding project: ' + err.message });
    }
});

router.patch('/:projectId/update-budget', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { totalBudget } = req.body;

        if (totalBudget === undefined || isNaN(Number(totalBudget))) {
            return res.status(400).json({ message: 'Valid totalBudget is required.' });
        }

        const updatedProject = await Project.findOneAndUpdate(
            { _id: projectId, userId: req.auth.userId },
            { totalBudget: Number(totalBudget) },
            { new: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json({ message: 'Budget updated successfully!', project: updatedProject });
    } catch (err) {
        console.error(`Error updating budget for project (${req.params.projectId}):`, err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

router.delete('/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const project = await Project.findOne({ _id: projectId, userId: req.auth.userId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        await Project.findByIdAndDelete(projectId, { session });
        await Expense.deleteMany({ projectId: projectId, userId: req.auth.userId }, { session });
        await Payment.deleteMany({ projectId: projectId, userId: req.auth.userId }, { session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ message: 'Project and all associated data deleted successfully.' });

    } catch (err) {
        console.error(`Error deleting project (${req.params.projectId}):`, err);
        res.status(500).json({ message: 'Server Error: ' + err.message });
    }
});

router.get('/:projectId/expenses', getProjectExpensesByDateRange);

module.exports = router;