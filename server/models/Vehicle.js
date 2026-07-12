const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: [true, 'Vehicle name/model is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Vehicle type is required'],
    enum: ['Truck', 'Van', 'Semi', 'Box Truck'],
  },
  maxLoadCapacity: {
    type: Number,
    required: [true, 'Maximum load capacity (kg) is required'],
  },
  odometer: {
    type: Number,
    required: [true, 'Odometer reading is required'],
    default: 0,
  },
  lastServiceOdometer: {
    type: Number,
    default: 0,
  },
  acquisitionCost: {
    type: Number,
    required: [true, 'Acquisition cost is required'],
  },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual property to calculate maintenance risk score (0-100)
VehicleSchema.virtual('maintenanceRiskScore').get(function () {
  if (this.status === 'Retired') return 0;
  
  const mileageSinceService = Math.max(0, this.odometer - this.lastServiceOdometer);
  const serviceInterval = 10000; // Target maintenance interval of 10,000 miles
  
  // Base risk increases with mileage since service
  let score = (mileageSinceService / serviceInterval) * 80;
  
  // Add a small penalty if odometer is very high (older vehicle wear and tear)
  if (this.odometer > 100000) {
    score += 10;
  }
  if (this.odometer > 200000) {
    score += 10;
  }

  // Cap at 100 and floor the result
  return Math.min(100, Math.max(0, Math.floor(score)));
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
