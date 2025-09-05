const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
  userId: { type: String, required: true },
  projectName: { type: String, required: true, trim: true },
  totalBudget: { type: Number, required: true },
  ownerPaid: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;