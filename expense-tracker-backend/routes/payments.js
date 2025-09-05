const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Payment = require('../models/payment.model.js');
const Project = require('../models/project.model.js');

router.get('/:projectId', async (req, res) => {
  try {
    // --- FIX 1: Added validation to prevent server crash from invalid MongoDB ObjectIds ---
    if (!mongoose.Types.ObjectId.isValid(req.params.projectId)) {
        return res.status(400).json({ message: 'Invalid Project ID.' });
    }
    const project = await Project.findOne({ _id: req.params.projectId, userId: req.auth.userId });
    if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
    }
    const payments = await Payment.find({ projectId: req.params.projectId, userId: req.auth.userId }).sort({ paymentDate: 'desc' });
    res.json(payments);
  } catch (err) {
    res.status(400).json('Error: ' + err.message);
  }
});

router.get('/range/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { startDate, endDate } = req.query;

        // --- FIX 1: Added validation to prevent server crash from invalid MongoDB ObjectIds ---
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ message: 'Invalid Project ID.' });
        }

        const project = await Project.findOne({ _id: projectId, userId: req.auth.userId });
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide both a start and end date.' });
        }

        const result = await Payment.aggregate([
            {
                $match: {
                    projectId: new mongoose.Types.ObjectId(projectId),
                    userId: req.auth.userId,
                    paymentDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const totalAmount = result.length > 0 ? result[0].total : 0;
        res.status(200).json({ total: totalAmount });
    } catch (error) {
        console.error('Error fetching payments by date range:', error);
        res.status(500).json({ message: 'Server error while fetching payments.' });
    }
});

// ... (The rest of the file remains unchanged, but is included for completeness)
router.post('/add', async (req, res) => {
  const { projectId, paymentDate, amount, description } = req.body;
  const paymentAmount = Number(amount);

  if (!projectId || !paymentDate || !paymentAmount) {
    return res.status(400).json('Missing required fields.');
  }

  try {
    const project = await Project.findOne({ _id: projectId, userId: req.auth.userId });
    if (!project) {
        return res.status(403).json({ message: 'Access denied.' });
    }

    const newPayment = new Payment({
      userId: req.auth.userId,
      projectId,
      paymentDate,
      amount: paymentAmount,
      description,
    });
    await newPayment.save();

    await Project.findByIdAndUpdate(projectId, { $inc: { ownerPaid: paymentAmount } });
    res.json('Payment added successfully!');
  } catch (err) {
    res.status(400).json('Error: ' + err.message);
  }
});

router.put('/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    const { amount, paymentDate, description } = req.body;
    const newAmount = Number(amount);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const originalPayment = await Payment.findOne({ _id: paymentId, userId: req.auth.userId }).session(session);
        if (!originalPayment) { throw new Error('Payment not found'); }
        const originalAmount = originalPayment.amount;
        const difference = newAmount - originalAmount;

        originalPayment.amount = newAmount;
        originalPayment.paymentDate = paymentDate;
        originalPayment.description = description;
        await originalPayment.save({ session });

        await Project.findByIdAndUpdate(originalPayment.projectId, { $inc: { ownerPaid: difference } }, { session });

        await session.commitTransaction();
        res.json('Payment updated successfully!');
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json('Error: ' + err.message);
    } finally {
        session.endSession();
    }
});

router.delete('/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const paymentToDelete = await Payment.findOne({ _id: paymentId, userId: req.auth.userId }).session(session);
        if (!paymentToDelete) { throw new Error('Payment not found'); }
        const amountToSubtract = paymentToDelete.amount;

        await paymentToDelete.deleteOne({ session });

        await Project.findByIdAndUpdate(paymentToDelete.projectId, { $inc: { ownerPaid: -amountToSubtract } }, { session });

        await session.commitTransaction();
        res.json('Payment deleted successfully!');
    } catch (err) {
        await session.abortTransaction();
        res.status(400).json('Error: ' + err.message);
    } finally {
        session.endSession();
    }
});


module.exports = router;