const mongoose = require('mongoose');

const MaintenanceLogSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  description: {
    type: String,
    required: [true, 'Maintenance description is required'],
    trim: true,
  },
  cost: {
    type: Number,
    required: [true, 'Maintenance cost is required'],
    min: [0, 'Cost cannot be negative'],
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('MaintenanceLog', MaintenanceLogSchema);
