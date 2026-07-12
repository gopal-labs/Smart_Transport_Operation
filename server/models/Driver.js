const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  licenseCategory: {
    type: String,
    required: [true, 'License category is required'],
    trim: true,
  },
  licenseExpiryDate: {
    type: Date,
    required: [true, 'License expiry date is required'],
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  safetyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 100,
  },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
    default: 'Available',
  },
  completedTripsCount: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual property to check if license is expired
DriverSchema.virtual('isLicenseExpired').get(function () {
  if (!this.licenseExpiryDate) return false;
  return new Date(this.licenseExpiryDate) < new Date();
});

module.exports = mongoose.model('Driver', DriverSchema);
