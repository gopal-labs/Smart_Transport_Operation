const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    unique: true,
  },
  source: {
    type: String,
    required: [true, 'Source location is required'],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, 'Destination location is required'],
    trim: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver is required'],
  },
  cargoWeight: {
    type: Number,
    required: [true, 'Cargo weight (kg) is required'],
    min: [0, 'Cargo weight cannot be negative'],
  },
  plannedDistance: {
    type: Number,
    required: [true, 'Planned distance (miles) is required'],
    min: [0.1, 'Planned distance must be greater than 0'],
  },
  status: {
    type: String,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft',
  },
  weather: {
    type: String,
    enum: ['Clear', 'Rain', 'Fog', 'Snow'],
    default: 'Clear',
  },
  riskScore: {
    type: Number,
    default: 0,
  },
  riskAssessment: {
    driverRiskFactor: { type: Number, default: 0 },
    cargoRiskFactor: { type: Number, default: 0 },
    vehicleRiskFactor: { type: Number, default: 0 },
    weatherRiskFactor: { type: Number, default: 0 },
  },
  overrideReason: {
    type: String,
    default: '',
  },
  actualFuelUsed: {
    type: Number,
    default: null,
  },
  co2Emissions: {
    type: Number,
    default: 0,
  },
  dispatchedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-generate trip ID
TripSchema.pre('save', async function (next) {
  if (!this.tripId) {
    const count = await this.constructor.countDocuments();
    this.tripId = `TRIP-${1000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Trip', TripSchema);
