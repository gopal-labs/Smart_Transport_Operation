const mongoose = require('mongoose');

const FuelLogSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  odometer: {
    type: Number,
    required: [true, 'Odometer reading at refueling is required'],
  },
  liters: {
    type: Number,
    required: [true, 'Fuel quantity in liters is required'],
    min: [0.1, 'Liters must be greater than 0'],
  },
  cost: {
    type: Number,
    required: [true, 'Fuel cost is required'],
    min: [0, 'Cost cannot be negative'],
  },
  date: {
    type: Date,
    required: [true, 'Refueling date is required'],
    default: Date.now,
  },
  isAnomaly: {
    type: Boolean,
    default: false,
  },
  anomalyReason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FuelLog', FuelLogSchema);
