const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const expenseSchema = new Schema({
  userId: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  expenseDate: { type: Date, required: true },
  category: { type: String, required: true },
  itemName: { type: String, required: true },
  price: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  other: { type: String, trim: true },
  total: { type: Number, required: true },
}, {
  timestamps: true,
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;