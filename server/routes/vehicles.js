const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all vehicles
// @route   GET /api/vehicles
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let vehicles = await Vehicle.find({});
    
    // Remove financial data for drivers
    if (req.user.role === 'Driver') {
      vehicles = vehicles.map(vehicle => {
        const obj = vehicle.toObject();
        delete obj.acquisitionCost;
        return obj;
      });
    }

    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single vehicle
// @route   GET /api/vehicles/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.id || req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const obj = vehicle.toObject();
    if (req.user.role === 'Driver') {
      delete obj.acquisitionCost;
    }

    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a vehicle
// @route   POST /api/vehicles
// @access  Private (Fleet Manager only)
router.post('/', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    const { registrationNumber, name, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;

    const exists = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Registration number already exists' });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      name,
      type,
      maxLoadCapacity,
      odometer,
      acquisitionCost,
      status: status || 'Available',
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Fleet Manager only)
router.put('/:id', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check if updating registration number and if it already exists
    if (req.body.registrationNumber && req.body.registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const exists = await Vehicle.findOne({ registrationNumber: req.body.registrationNumber.toUpperCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Registration number already exists' });
      }
    }

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: vehicle });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Fleet Manager only)
router.delete('/:id', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    await vehicle.deleteOne();
    res.json({ success: true, message: 'Vehicle removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
