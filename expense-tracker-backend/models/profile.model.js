const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  companyName: { type: String, default: 'Your Company Name' },
  addressLine1: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  addressLine3: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
}, {
  timestamps: true,
});

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;