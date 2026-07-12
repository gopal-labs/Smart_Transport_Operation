const express = require('express');
const router = express.Router();
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const { protect, authorize } = require('../middleware/auth');

// ==========================================
// FUEL LOGS
// ==========================================

// @desc    Get all fuel logs
// @route   GET /api/expenses/fuel
// @access  Private
router.get('/fuel', protect, async (req, res) => {
  try {
    const logs = await FuelLog.find({}).populate('vehicle').sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a fuel log & run anomaly check
// @route   POST /api/expenses/fuel
// @access  Private
router.post('/fuel', protect, async (req, res) => {
  try {
    const { vehicleId, odometer, liters, cost, date } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Find the previous fuel log for this vehicle to calculate fuel efficiency
    const prevLog = await FuelLog.findOne({ vehicle: vehicleId }).sort({ odometer: -1 });

    let isAnomaly = false;
    let anomalyReason = '';

    if (prevLog) {
      const distance = odometer - prevLog.odometer;
      
      if (distance <= 0) {
        return res.status(400).json({
          success: false,
          message: `New odometer (${odometer} mi) must be greater than previous refueling odometer (${prevLog.odometer} mi)`
        });
      }

      const efficiency = distance / liters; // miles per liter or km per liter
      
      // Calculate historical average efficiency for this vehicle
      const pastLogs = await FuelLog.find({ vehicle: vehicleId }).limit(5);
      let totalEff = 0;
      let count = 0;

      // Build historical efficiency
      for (let i = 0; i < pastLogs.length - 1; i++) {
        const d = pastLogs[i].odometer - pastLogs[i+1].odometer;
        if (d > 0) {
          totalEff += (d / pastLogs[i].liters);
          count++;
        }
      }

      if (count > 0) {
        const avgEfficiency = totalEff / count;
        const deviation = (efficiency - avgEfficiency) / avgEfficiency;

        // Anomaly: efficiency is > 30% below average (high consumption/theft) or > 50% above average (entry error)
        if (deviation < -0.3) {
          isAnomaly = true;
          anomalyReason = `Fuel efficiency is ${Math.round(Math.abs(deviation) * 100)}% below vehicle's historical average (${efficiency.toFixed(2)} vs ${avgEfficiency.toFixed(2)} mi/L). Possible fuel leak, theft, or odometer error.`;
        } else if (deviation > 0.5) {
          isAnomaly = true;
          anomalyReason = `Fuel efficiency is abnormally high: ${Math.round(deviation * 100)}% above average (${efficiency.toFixed(2)} vs ${avgEfficiency.toFixed(2)} mi/L). Likely data entry error.`;
        }
      }
    } else {
      // First fuel log, let's verify odometer is not less than vehicle's current odometer
      if (odometer < vehicle.odometer - 1000) {
        isAnomaly = true;
        anomalyReason = `Starting refueling odometer (${odometer}) is significantly lower than current vehicle odometer record (${vehicle.odometer}).`;
      }
    }

    const log = await FuelLog.create({
      vehicle: vehicleId,
      odometer,
      liters,
      cost,
      date: date || new Date(),
      isAnomaly,
      anomalyReason,
    });

    // Sync vehicle odometer if this fuel log has a higher reading
    if (odometer > vehicle.odometer) {
      vehicle.odometer = odometer;
      await vehicle.save();
    }

    const populatedLog = await FuelLog.findById(log._id).populate('vehicle');
    res.status(201).json({ success: true, data: populatedLog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// GENERAL EXPENSES
// ==========================================

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({}).populate('vehicle').sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create an expense & run anomaly check
// @route   POST /api/expenses
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { vehicleId, category, amount, date, description } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    let isAnomaly = false;
    let anomalyReason = '';

    // Anomaly Check: Compare expense to previous entries in same category
    const pastExpenses = await Expense.find({ category }).sort({ date: -1 }).limit(10);
    
    if (pastExpenses.length >= 2) {
      const sum = pastExpenses.reduce((acc, curr) => acc + curr.amount, 0);
      const avg = sum / pastExpenses.length;

      // Flag if expense is > 200% of rolling average
      if (amount > avg * 2) {
        isAnomaly = true;
        anomalyReason = `Expense amount ($${amount}) is more than double the rolling average ($${avg.toFixed(2)}) for category: ${category}.`;
      }
    } else {
      // Default limits for safety check
      if (category === 'Tolls' && amount > 150) {
        isAnomaly = true;
        anomalyReason = `Toll expense amount ($${amount}) exceeds default alert threshold of $150.`;
      } else if (category === 'Other' && amount > 1000) {
        isAnomaly = true;
        anomalyReason = `Miscellaneous expense amount ($${amount}) exceeds default alert threshold of $1000.`;
      }
    }

    const expense = await Expense.create({
      vehicle: vehicleId,
      category,
      amount,
      date: date || new Date(),
      description,
      isAnomaly,
      anomalyReason,
    });

    const populatedExpense = await Expense.findById(expense._id).populate('vehicle');
    res.status(201).json({ success: true, data: populatedExpense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ANOMALY REVIEW QUEUE
// ==========================================

// @desc    Get all anomalies (Fuel + Expense)
// @route   GET /api/expenses/anomalies
// @access  Private (Financial Analyst and Fleet Manager only)
router.get('/anomalies', protect, authorize('Financial Analyst', 'Fleet Manager'), async (req, res) => {
  try {
    const fuelAnomalies = await FuelLog.find({ isAnomaly: true }).populate('vehicle');
    const expenseAnomalies = await Expense.find({ isAnomaly: true }).populate('vehicle');

    // Combine them with a type tag
    const combined = [
      ...fuelAnomalies.map(item => {
        const obj = item.toObject();
        obj.type = 'Fuel';
        return obj;
      }),
      ...expenseAnomalies.map(item => {
        const obj = item.toObject();
        obj.type = 'Expense';
        return obj;
      })
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: combined });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Resolve / Dismiss anomaly
// @route   PUT /api/expenses/anomalies/:type/:id
// @access  Private (Financial Analyst and Fleet Manager only)
router.put('/anomalies/:type/:id', protect, authorize('Financial Analyst', 'Fleet Manager'), async (req, res) => {
  try {
    const { type, id } = req.params;
    const { action } = req.body; // 'approve' or 'dismiss'
    
    if (type === 'Fuel') {
      const log = await FuelLog.findById(id);
      if (!log) return res.status(404).json({ success: false, message: 'Fuel log not found' });
      
      log.isAnomaly = false;
      log.anomalyReason = action === 'approve' ? 'Approved (Verified)' : 'Dismissed (Omit)';
      await log.save();
      return res.json({ success: true, message: 'Fuel anomaly resolved', data: log });
    } else if (type === 'Expense') {
      const expense = await Expense.findById(id);
      if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
      
      expense.isAnomaly = false;
      expense.anomalyReason = action === 'approve' ? 'Approved (Verified)' : 'Dismissed (Omit)';
      await expense.save();
      return res.json({ success: true, message: 'Expense anomaly resolved', data: expense });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid anomaly type' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
