const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const MaintenanceLog = require('../models/MaintenanceLog');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const { Parser } = require('json2csv');

// Helper to calculate revenue for ROI
// Revenue = plannedDistance * (cargoWeight / 1000) * 2.5 (Tonnage * Miles * Rate)
const calculateTripRevenue = (trip) => {
  if (trip.status !== 'Completed') return 0;
  const cargoTons = trip.cargoWeight / 1000;
  return Math.round(trip.plannedDistance * cargoTons * 2.5);
};

// @desc    Get dashboard KPIs and charts
// @route   GET /api/reports/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const { vehicleType, status, region } = req.query;

    // Build filters for vehicle queries
    let vehicleFilter = {};
    if (vehicleType) vehicleFilter.type = vehicleType;
    if (status) vehicleFilter.status = status;

    const vehicles = await Vehicle.find(vehicleFilter);
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'In Shop').length;
    const retiredVehicles = vehicles.filter(v => v.status === 'Retired').length;

    // Drivers duty status
    const drivers = await Driver.find({});
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'On Trip').length;
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;
    const offDutyDrivers = drivers.filter(d => d.status === 'Off Duty').length;
    const suspendedDrivers = drivers.filter(d => d.status === 'Suspended').length;

    // Trips count
    const activeTrips = await Trip.countDocuments({ status: 'Dispatched' });
    const pendingTrips = await Trip.countDocuments({ status: 'Draft' });
    const completedTrips = await Trip.countDocuments({ status: 'Completed' });

    // Fleet utilization percentage
    // (Vehicles On Trip / (Available + On Trip)) * 100
    const runningPool = availableVehicles + activeVehicles;
    const fleetUtilization = runningPool > 0 ? Math.round((activeVehicles / runningPool) * 100) : 0;

    // Financial calculations
    const fuelLogs = await FuelLog.find({});
    const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
    const totalFuelLiters = fuelLogs.reduce((acc, curr) => acc + curr.liters, 0);

    const maintenanceLogs = await MaintenanceLog.find({});
    const totalMaintenanceCost = maintenanceLogs.reduce((acc, curr) => acc + curr.cost, 0);

    const otherExpenses = await Expense.find({});
    const totalOtherCost = otherExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost + totalOtherCost;

    // Trips Revenue
    const completedTripDocs = await Trip.find({ status: 'Completed' });
    const totalRevenue = completedTripDocs.reduce((acc, curr) => acc + calculateTripRevenue(curr), 0);

    // ESG Carbon totals
    const totalCO2Emissions = completedTripDocs.reduce((acc, curr) => acc + (curr.co2Emissions || 0), 0);

    // Get fuel cost and mileage trends over last 6 months for chart
    // We can group expenses by category for chart
    const expenseBreakdown = [
      { name: 'Fuel', value: totalFuelCost },
      { name: 'Maintenance', value: totalMaintenanceCost },
      { name: 'Other (Tolls/Permits)', value: totalOtherCost }
    ];

    res.json({
      success: true,
      data: {
        kpis: {
          totalVehicles,
          activeVehicles,
          availableVehicles,
          maintenanceVehicles,
          retiredVehicles,
          activeTrips,
          pendingTrips,
          completedTrips,
          totalDrivers,
          activeDrivers,
          availableDrivers,
          offDutyDrivers,
          suspendedDrivers,
          fleetUtilization,
          totalOperationalCost,
          totalRevenue,
          totalCO2Emissions,
        },
        expenseBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed report per vehicle
// @route   GET /api/reports/vehicles
// @access  Private
router.get('/vehicles', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    const report = [];

    for (const vehicle of vehicles) {
      // Find fuel logs
      const vehicleFuelLogs = await FuelLog.find({ vehicle: vehicle._id });
      const fuelCost = vehicleFuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
      const fuelLiters = vehicleFuelLogs.reduce((acc, curr) => acc + curr.liters, 0);

      // Find maintenance logs
      const vehicleMaintLogs = await MaintenanceLog.find({ vehicle: vehicle._id });
      const maintenanceCost = vehicleMaintLogs.reduce((acc, curr) => acc + curr.cost, 0);

      // Find other expenses
      const vehicleExpenses = await Expense.find({ vehicle: vehicle._id });
      const otherCost = vehicleExpenses.reduce((acc, curr) => acc + curr.amount, 0);

      // Calculate total operational cost
      const totalOpCost = fuelCost + maintenanceCost + otherCost;

      // Find completed trips for revenue & mileage
      const vehicleTrips = await Trip.find({ vehicle: vehicle._id, status: 'Completed' });
      const revenue = vehicleTrips.reduce((acc, curr) => acc + calculateTripRevenue(curr), 0);
      const co2 = vehicleTrips.reduce((acc, curr) => acc + (curr.co2Emissions || 0), 0);
      const distance = vehicleTrips.reduce((acc, curr) => acc + curr.plannedDistance, 0);

      // ROI = (Revenue - Expenses) / Acquisition Cost
      let roi = 0;
      if (vehicle.acquisitionCost > 0) {
        roi = ((revenue - totalOpCost) / vehicle.acquisitionCost) * 100;
      }

      // Fuel Efficiency (miles per liter)
      const efficiency = fuelLiters > 0 ? (distance / fuelLiters) : 0;

      report.push({
        id: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        type: vehicle.type,
        odometer: vehicle.odometer,
        acquisitionCost: vehicle.acquisitionCost,
        status: vehicle.status,
        maintenanceRiskScore: vehicle.maintenanceRiskScore,
        fuelCost,
        maintenanceCost,
        otherCost,
        totalOperationalCost: totalOpCost,
        distanceTraveled: distance,
        tripsCount: vehicleTrips.length,
        revenue,
        co2Emissions: co2,
        roi: Math.round(roi * 10) / 10,
        fuelEfficiency: Math.round(efficiency * 10) / 10
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Export vehicles report as CSV
// @route   GET /api/reports/export/csv
// @access  Private
router.get('/export/csv', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({});
    const reportData = [];

    for (const vehicle of vehicles) {
      const fuelLogs = await FuelLog.find({ vehicle: vehicle._id });
      const fuelCost = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
      const fuelLiters = fuelLogs.reduce((acc, curr) => acc + curr.liters, 0);

      const maintLogs = await MaintenanceLog.find({ vehicle: vehicle._id });
      const maintenanceCost = maintLogs.reduce((acc, curr) => acc + curr.cost, 0);

      const expenses = await Expense.find({ vehicle: vehicle._id });
      const otherCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);

      const totalOpCost = fuelCost + maintenanceCost + otherCost;

      const trips = await Trip.find({ vehicle: vehicle._id, status: 'Completed' });
      const revenue = trips.reduce((acc, curr) => acc + calculateTripRevenue(curr), 0);
      const co2 = trips.reduce((acc, curr) => acc + (curr.co2Emissions || 0), 0);
      const distance = trips.reduce((acc, curr) => acc + curr.plannedDistance, 0);

      let roi = 0;
      if (vehicle.acquisitionCost > 0) {
        roi = ((revenue - totalOpCost) / vehicle.acquisitionCost) * 100;
      }

      const efficiency = fuelLiters > 0 ? (distance / fuelLiters) : 0;

      reportData.push({
        'Registration Number': vehicle.registrationNumber,
        'Name': vehicle.name,
        'Type': vehicle.type,
        'Odometer (mi)': vehicle.odometer,
        'Status': vehicle.status,
        'Acquisition Cost ($)': vehicle.acquisitionCost,
        'Maintenance Cost ($)': maintenanceCost,
        'Fuel Cost ($)': fuelCost,
        'Other Expenses ($)': otherCost,
        'Total Operational Cost ($)': totalOpCost,
        'Estimated Revenue ($)': revenue,
        'ROI (%)': Math.round(roi * 10) / 10,
        'Distance Traveled (mi)': distance,
        'CO2 Footprint (kg)': co2,
        'Fuel Efficiency (mi/L)': Math.round(efficiency * 10) / 10
      });
    }

    const fields = [
      'Registration Number', 'Name', 'Type', 'Odometer (mi)', 'Status',
      'Acquisition Cost ($)', 'Maintenance Cost ($)', 'Fuel Cost ($)', 'Other Expenses ($)',
      'Total Operational Cost ($)', 'Estimated Revenue ($)', 'ROI (%)', 'Distance Traveled (mi)',
      'CO2 Footprint (kg)', 'Fuel Efficiency (mi/L)'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(reportData);

    res.header('Content-Type', 'text/csv');
    res.attachment('TransitOps_Fleet_Report.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
