const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { protect, authorize } = require('../middleware/auth');

// Helper to calculate risk score and assessment
const calculateRisk = (vehicle, driver, cargoWeight, plannedDistance, weather) => {
  const driverRisk = (100 - driver.safetyScore) * 0.4;
  const cargoRatio = cargoWeight / vehicle.maxLoadCapacity;
  const cargoRisk = cargoRatio * 30;
  
  // Calculate vehicle maintenance risk
  const mileageSinceService = Math.max(0, vehicle.odometer - vehicle.lastServiceOdometer);
  const serviceInterval = 10000;
  let vehicleRiskBase = (mileageSinceService / serviceInterval) * 80;
  if (vehicle.odometer > 100000) vehicleRiskBase += 10;
  if (vehicle.odometer > 200000) vehicleRiskBase += 10;
  const vehicleRiskVal = Math.min(100, Math.max(0, Math.floor(vehicleRiskBase)));
  const vehicleRisk = vehicleRiskVal * 0.2;

  // Weather factor
  let weatherRisk = 0;
  if (weather === 'Rain') weatherRisk = 10;
  if (weather === 'Fog') weatherRisk = 20;
  if (weather === 'Snow') weatherRisk = 30;

  // Distance factor
  const distanceRisk = Math.min(10, plannedDistance / 100);

  const totalRisk = Math.min(100, Math.round(driverRisk + cargoRisk + vehicleRisk + weatherRisk + distanceRisk));

  return {
    totalRisk,
    assessment: {
      driverRiskFactor: Math.round(driverRisk),
      cargoRiskFactor: Math.round(cargoRisk),
      vehicleRiskFactor: Math.round(vehicleRisk),
      weatherRiskFactor: weatherRisk,
    }
  };
};

// @desc    Get all trips
// @route   GET /api/trips
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    
    // Drivers can only see trips assigned to them (linked via their driver profile)
    if (req.user.role === 'Driver') {
      const driver = await Driver.findOne({ user: req.user._id });
      if (driver) {
        query = { driver: driver._id };
      } else {
        // If not linked, search by driver name as backup or return none
        return res.json({ success: true, data: [] });
      }
    }

    const trips = await Trip.find(query)
      .populate('vehicle')
      .populate('driver')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single trip
// @route   GET /api/trips/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate('driver');
      
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a trip
// @route   POST /api/trips
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, weather } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    const driver = await Driver.findById(driverId);

    if (!vehicle || !driver) {
      return res.status(400).json({ success: false, message: 'Invalid vehicle or driver' });
    }

    // Business Rule: Cargo Weight cannot exceed vehicle max load
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        success: false,
        message: `Cargo weight (${cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg)`
      });
    }

    // Business Rule: Retired or In Shop vehicles cannot be selected
    if (vehicle.status === 'Retired' || vehicle.status === 'In Shop') {
      return res.status(400).json({
        success: false,
        message: `Vehicle is currently ${vehicle.status} and cannot be assigned`
      });
    }

    // Business Rule: Drivers with expired licenses or Suspended status cannot be assigned
    const isExpired = new Date(driver.licenseExpiryDate) < new Date();
    if (isExpired) {
      return res.status(400).json({ success: false, message: 'Driver license is expired' });
    }
    if (driver.status === 'Suspended') {
      return res.status(400).json({ success: false, message: 'Driver is currently suspended' });
    }

    // Business Rule: A vehicle or driver already On Trip cannot be assigned
    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ success: false, message: 'Vehicle is already on a trip' });
    }
    if (driver.status === 'On Trip') {
      return res.status(400).json({ success: false, message: 'Driver is already on a trip' });
    }

    // Calculate risk
    const { totalRisk, assessment } = calculateRisk(vehicle, driver, cargoWeight, plannedDistance, weather || 'Clear');

    const trip = await Trip.create({
      source,
      destination,
      vehicle: vehicleId,
      driver: driverId,
      cargoWeight,
      plannedDistance,
      weather: weather || 'Clear',
      riskScore: totalRisk,
      riskAssessment: assessment,
      status: 'Draft',
    });

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update / Dispatch / Complete / Cancel trip
// @route   PUT /api/trips/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const { status, overrideReason, actualFuelUsed } = req.body;

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (status && status !== trip.status) {
      // Transitioning to Dispatched
      if (status === 'Dispatched') {
        // Enforce high risk override rules
        if (trip.riskScore >= 70 && !overrideReason) {
          return res.status(400).json({
            success: false,
            requiresOverride: true,
            message: 'Trip risk score is High (>= 70). Fleet Manager override confirmation required.'
          });
        }

        // Check availability again at actual dispatch time
        if (vehicle.status === 'On Trip') {
          return res.status(400).json({ success: false, message: 'Vehicle is currently occupied on another trip.' });
        }
        if (driver.status === 'On Trip') {
          return res.status(400).json({ success: false, message: 'Driver is currently occupied on another trip.' });
        }
        if (vehicle.status === 'In Shop' || vehicle.status === 'Retired') {
          return res.status(400).json({ success: false, message: `Vehicle is in ${vehicle.status} status and cannot be dispatched.` });
        }
        if (driver.status === 'Suspended') {
          return res.status(400).json({ success: false, message: 'Driver is suspended.' });
        }

        // Set status to On Trip
        vehicle.status = 'On Trip';
        driver.status = 'On Trip';
        await vehicle.save();
        await driver.save();

        trip.status = 'Dispatched';
        trip.dispatchedAt = new Date();
        if (overrideReason) {
          trip.overrideReason = overrideReason;
        }
      }

      // Transitioning to Completed
      else if (status === 'Completed') {
        if (trip.status !== 'Dispatched') {
          return res.status(400).json({ success: false, message: 'Only dispatched trips can be completed.' });
        }

        // Calculate CO2 emissions
        let co2 = 0;
        if (actualFuelUsed) {
          // Gallons * 10.18 kg of CO2 per gallon
          co2 = parseFloat(actualFuelUsed) * 10.18;
          trip.actualFuelUsed = parseFloat(actualFuelUsed);
        } else {
          // Approximation: cargo weight > 5000 kg -> heavy truck (0.9 kg CO2/mi), else light (0.4 kg CO2/mi)
          const multiplier = trip.cargoWeight > 5000 ? 0.9 : 0.4;
          co2 = trip.plannedDistance * multiplier;
        }

        trip.co2Emissions = Math.round(co2);
        trip.status = 'Completed';
        trip.completedAt = new Date();

        // Release vehicle and driver, update stats
        vehicle.status = 'Available';
        vehicle.odometer = vehicle.odometer + trip.plannedDistance;
        await vehicle.save();

        driver.status = 'Available';
        driver.completedTripsCount = driver.completedTripsCount + 1;
        // Increment driver safety score slightly for on-time completed trip (max 100)
        driver.safetyScore = Math.min(100, driver.safetyScore + 1);
        await driver.save();
      }

      // Transitioning to Cancelled
      else if (status === 'Cancelled') {
        // If trip was Dispatched, release the vehicle and driver back to Available
        if (trip.status === 'Dispatched') {
          vehicle.status = 'Available';
          driver.status = 'Available';
          await vehicle.save();
          await driver.save();
        }
        trip.status = 'Cancelled';
      }
    }

    // Apply other updates
    if (req.body.source) trip.source = req.body.source;
    if (req.body.destination) trip.destination = req.body.destination;
    if (req.body.cargoWeight) trip.cargoWeight = req.body.cargoWeight;
    
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id).populate('vehicle').populate('driver');
    res.json({ success: true, data: populatedTrip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Simulate real-time telemetry events
// @route   POST /api/trips/:id/telemetry
// @access  Private
router.post('/:id/telemetry', protect, async (req, res) => {
  try {
    const { eventType } = req.body; // 'speeding', 'sudden_braking', 'route_deviation'
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ success: false, message: 'Telemetry is only active for Dispatched trips' });
    }

    const driver = await Driver.findById(trip.driver);
    let penalty = 0;
    let message = '';

    if (eventType === 'speeding') {
      penalty = 3;
      message = 'Speed limit exceeded. Deducted 3 points from Driver safety score.';
    } else if (eventType === 'sudden_braking') {
      penalty = 1;
      message = 'Hard braking event detected. Deducted 1 point from Driver safety score.';
    } else if (eventType === 'route_deviation') {
      penalty = 5;
      message = 'Route deviation / Geofence breach warning! Deducted 5 points from Driver safety score.';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid telemetry event type' });
    }

    if (driver) {
      driver.safetyScore = Math.max(0, driver.safetyScore - penalty);
      if (driver.safetyScore < 40) {
        driver.status = 'Suspended';
        message += ' Driver safety score has dropped below 40. Driver status updated to Suspended.';
      }
      await driver.save();
    }

    res.json({
      success: true,
      message,
      driverSafetyScore: driver ? driver.safetyScore : null,
      driverStatus: driver ? driver.status : null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
