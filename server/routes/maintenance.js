const express = require('express');
const router = express.Router();
const MaintenanceLog = require('../models/MaintenanceLog');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all maintenance logs
// @route   GET /api/maintenance
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const logs = await MaintenanceLog.find({}).populate('vehicle').sort({ createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a maintenance log
// @route   POST /api/maintenance
// @access  Private (Fleet Manager only)
router.post('/', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    const { vehicleId, description, cost, startDate } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ success: false, message: 'Cannot put a retired vehicle into maintenance' });
    }

    const log = await MaintenanceLog.create({
      vehicle: vehicleId,
      description,
      cost,
      startDate: startDate || new Date(),
      status: 'Active',
    });

    // Business Rule: Creating an active maintenance record sets vehicle to In Shop
    vehicle.status = 'In Shop';
    await vehicle.save();

    const populatedLog = await MaintenanceLog.findById(log._id).populate('vehicle');
    res.status(201).json({ success: true, data: populatedLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update / Close maintenance log
// @route   PUT /api/maintenance/:id
// @access  Private (Fleet Manager only)
router.put('/:id', protect, authorize('Fleet Manager'), async (req, res) => {
  try {
    let log = await MaintenanceLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    const { description, cost, status, endDate } = req.body;

    if (description) log.description = description;
    if (cost !== undefined) log.cost = cost;

    // Transitioning from Active to Completed
    if (status === 'Completed' && log.status !== 'Completed') {
      log.status = 'Completed';
      log.endDate = endDate || new Date();

      const vehicle = await Vehicle.findById(log.vehicle);
      if (vehicle) {
        // Business Rule: Closing maintenance restores Available status unless Retired
        if (vehicle.status !== 'Retired') {
          vehicle.status = 'Available';
          // Update lastServiceOdometer to the vehicle's current odometer reading
          vehicle.lastServiceOdometer = vehicle.odometer;
          await vehicle.save();
        }
      }
    }

    await log.save();

    const populatedLog = await MaintenanceLog.findById(log._id).populate('vehicle');
    res.json({ success: true, data: populatedLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
