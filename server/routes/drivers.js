const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all drivers
// @route   GET /api/drivers
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let drivers = await Driver.find({});
    
    // Add bonus and efficiency simulation details to drivers
    const driversWithIncentives = drivers.map(driver => {
      const obj = driver.toObject();
      
      // Bonus logic: $100 per completed trip base, multiplied by safety score factor (e.g., safetyScore / 100)
      const baseTripPay = 100;
      const safetyMultiplier = driver.safetyScore / 100;
      const calculatedBonus = Math.floor(driver.completedTripsCount * baseTripPay * safetyMultiplier);
      
      obj.simulatedBonus = calculatedBonus;
      obj.incentiveTier = driver.safetyScore >= 95 ? 'Platinum' : driver.safetyScore >= 85 ? 'Gold' : driver.safetyScore >= 70 ? 'Silver' : 'Basic';
      obj.isLicenseExpired = new Date(driver.licenseExpiryDate) < new Date();
      
      return obj;
    });

    res.json({ success: true, data: driversWithIncentives });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single driver
// @route   GET /api/drivers/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    const obj = driver.toObject();
    const baseTripPay = 100;
    const safetyMultiplier = driver.safetyScore / 100;
    obj.simulatedBonus = Math.floor(driver.completedTripsCount * baseTripPay * safetyMultiplier);
    obj.incentiveTier = driver.safetyScore >= 95 ? 'Platinum' : driver.safetyScore >= 85 ? 'Gold' : driver.safetyScore >= 70 ? 'Silver' : 'Basic';
    obj.isLicenseExpired = new Date(driver.licenseExpiryDate) < new Date();

    res.json({ success: true, data: obj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a driver
// @route   POST /api/drivers
// @access  Private (Fleet Manager or Safety Officer only)
router.post('/', protect, authorize('Fleet Manager', 'Safety Officer'), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, safetyScore, status } = req.body;

    const exists = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'License number already exists' });
    }

    const driver = await Driver.create({
      name,
      licenseNumber,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore: safetyScore !== undefined ? safetyScore : 100,
      status: status || 'Available',
    });

    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a driver
// @route   PUT /api/drivers/:id
// @access  Private (Fleet Manager or Safety Officer only)
router.put('/:id', protect, authorize('Fleet Manager', 'Safety Officer'), async (req, res) => {
  try {
    let driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    // Check if updating license number and if it already exists
    if (req.body.licenseNumber && req.body.licenseNumber.toUpperCase() !== driver.licenseNumber) {
      const exists = await Driver.findOne({ licenseNumber: req.body.licenseNumber.toUpperCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'License number already exists' });
      }
    }

    driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: driver });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a driver
// @route   DELETE /api/drivers/:id
// @access  Private (Fleet Manager or Safety Officer only)
router.delete('/:id', protect, authorize('Fleet Manager', 'Safety Officer'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }

    await driver.deleteOne();
    res.json({ success: true, message: 'Driver removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
