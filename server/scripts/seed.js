require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const MaintenanceLog = require('../models/MaintenanceLog');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear all existing data
    console.log('Clearing old collections...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});

    console.log('Creating Users...');
    // Seed Users (passwords hashed in pre-save)
    const manager = await User.create({
      name: 'Gopal',
      email: 'manager@transitops.com',
      password: 'password123',
      role: 'Fleet Manager',
    });

    const driverUser = await User.create({
      name: 'Harry Singh',
      email: 'driver@transitops.com',
      password: 'password123',
      role: 'Driver',
    });

    const safetyOfficer = await User.create({
      name: 'Himanshu Jain',
      email: 'safety@transitops.com',
      password: 'password123',
      role: 'Safety Officer',
    });

    const analyst = await User.create({
      name: 'Shivam Gupta',
      email: 'finance@transitops.com',
      password: 'password123',
      role: 'Financial Analyst',
    });

    console.log('Creating Vehicles...');
    // Seed Vehicles (India region equivalents)
    const v1 = await Vehicle.create({
      registrationNumber: 'DL-01-A-1201',
      name: 'Tata Prima Semi-Trailer',
      type: 'Semi',
      maxLoadCapacity: 20000,
      odometer: 145200,
      lastServiceOdometer: 142000,
      acquisitionCost: 3500000, // INR
      status: 'Available',
    });

    const v2 = await Vehicle.create({
      registrationNumber: 'RJ-14-B-4402',
      name: 'Mahindra Bolero Pickup',
      type: 'Van',
      maxLoadCapacity: 4500,
      odometer: 85500,
      lastServiceOdometer: 74000, // 11,500 km since service -> High Risk Score (> 80%)
      acquisitionCost: 950000, // INR
      status: 'Available',
    });

    const v3 = await Vehicle.create({
      registrationNumber: 'HR-55-X-5603',
      name: 'Ashok Leyland Ecomet',
      type: 'Box Truck',
      maxLoadCapacity: 8000,
      odometer: 32400,
      lastServiceOdometer: 32400,
      acquisitionCost: 1800000, // INR
      status: 'In Shop',
    });

    const v4 = await Vehicle.create({
      registrationNumber: 'PB-02-Y-9904',
      name: 'BharatBenz Heavy Tipper',
      type: 'Semi',
      maxLoadCapacity: 22000,
      odometer: 12800,
      lastServiceOdometer: 10000,
      acquisitionCost: 4200000, // INR
      status: 'Available',
    });

    const v5 = await Vehicle.create({
      registrationNumber: 'GJ-01-Z-7705',
      name: 'Tata Ace Mini-Van',
      type: 'Van',
      maxLoadCapacity: 4000,
      odometer: 235000,
      lastServiceOdometer: 225000,
      acquisitionCost: 450000, // INR
      status: 'Retired',
    });

    console.log('Creating Drivers...');
    // Seed Drivers (North Indian Names)
    const expiryFuture = new Date();
    expiryFuture.setFullYear(expiryFuture.getFullYear() + 2);

    const expiryPast = new Date();
    expiryPast.setDate(expiryPast.getDate() - 15); // expired 15 days ago

    const d1 = await Driver.create({
      name: 'Harry Singh',
      licenseNumber: 'DL-142023908',
      licenseCategory: 'Trans-HMV',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+91-98765-01001',
      safetyScore: 92,
      status: 'Available',
      completedTripsCount: 45,
      user: driverUser._id, // Linked to the driver user
    });

    const d2 = await Driver.create({
      name: 'Gurpreet Singh',
      licenseNumber: 'PB-022022871',
      licenseCategory: 'Trans-HMV',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+91-98765-01002',
      safetyScore: 98,
      status: 'Available',
      completedTripsCount: 68,
    });

    const d3 = await Driver.create({
      name: 'Amit Sharma',
      licenseNumber: 'HR-552021590',
      licenseCategory: 'LMV-Commercial',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+91-98765-01003',
      safetyScore: 65,
      status: 'Available',
      completedTripsCount: 22,
    });

    const d4 = await Driver.create({
      name: 'Vikram Rathore',
      licenseNumber: 'RJ-142020443',
      licenseCategory: 'Trans-HMV',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+91-98765-01004',
      safetyScore: 85,
      status: 'Suspended',
      completedTripsCount: 15,
    });

    const d5 = await Driver.create({
      name: 'Karan Patel',
      licenseNumber: 'GJ-012019921',
      licenseCategory: 'LMV-Commercial',
      licenseExpiryDate: expiryPast, // License is expired
      contactNumber: '+91-98765-01005',
      safetyScore: 90,
      status: 'Available',
      completedTripsCount: 30,
    });

    console.log('Creating Maintenance Logs...');
    // Seed Active Maintenance for v3
    await MaintenanceLog.create({
      vehicle: v3._id,
      description: 'Engine transmission fluid flush & brake rotor replacement',
      cost: 12500, // INR
      startDate: new Date(),
      status: 'Active',
    });

    // Seed Completed Maintenance for v1
    await MaintenanceLog.create({
      vehicle: v1._id,
      description: 'Scheduled preventive maintenance service & inspection',
      cost: 4500, // INR
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      status: 'Completed',
    });

    console.log('Creating Trips...');
    // Completed trip 1
    const t1 = await Trip.create({
      tripId: 'TRIP-1001',
      source: 'New Delhi',
      destination: 'Jaipur',
      vehicle: v1._id,
      driver: d1._id,
      cargoWeight: 15000,
      plannedDistance: 270,
      weather: 'Clear',
      status: 'Completed',
      riskScore: 25,
      actualFuelUsed: 95, // Liters
      co2Emissions: Math.round(95 * 2.68),
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000),
    });

    // Completed trip 2
    const t2 = await Trip.create({
      tripId: 'TRIP-1002',
      source: 'Jaipur',
      destination: 'Gurugram',
      vehicle: v2._id,
      driver: d2._id,
      cargoWeight: 3000,
      plannedDistance: 240,
      weather: 'Rain',
      status: 'Completed',
      riskScore: 35,
      actualFuelUsed: 65, // Liters
      co2Emissions: Math.round(65 * 2.68),
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000),
    });

    // Active dispatched trip
    const t3 = await Trip.create({
      tripId: 'TRIP-1003',
      source: 'Chandigarh',
      destination: 'Amritsar',
      vehicle: v4._id,
      driver: d3._id,
      cargoWeight: 18000,
      plannedDistance: 230,
      weather: 'Fog',
      status: 'Dispatched',
      riskScore: 52,
      dispatchedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    });

    // Draft / Pending trip
    const t4 = await Trip.create({
      tripId: 'TRIP-1004',
      source: 'Ahmedabad',
      destination: 'Jaipur',
      vehicle: v1._id,
      driver: d1._id,
      cargoWeight: 14000,
      plannedDistance: 670,
      weather: 'Clear',
      status: 'Draft',
      riskScore: 28,
    });

    console.log('Creating Fuel Logs & Expenses (with anomalies)...');
    // Normal Fuel logs
    await FuelLog.create({
      vehicle: v1._id,
      odometer: 142240,
      liters: 106,
      cost: 9540, // INR
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isAnomaly: false,
    });

    await FuelLog.create({
      vehicle: v2._id,
      odometer: 74270,
      liters: 75.7,
      cost: 6813, // INR
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isAnomaly: false,
    });

    // ANOMALY Fuel log: Fuel leak/theft alert (liters filled = 150L, odometer moved only 30km)
    await FuelLog.create({
      vehicle: v1._id,
      odometer: 142270,
      liters: 150,
      cost: 13500, // INR
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isAnomaly: true,
      anomalyReason: 'Fuel efficiency is 91% below vehicle\'s historical average (0.20 vs 2.26 km/L). Possible fuel leak, theft, or odometer error.',
    });

    // Normal Expenses
    await Expense.create({
      vehicle: v1._id,
      category: 'Tolls',
      amount: 450, // INR
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      description: 'Delhi-Jaipur NH-48 Toll tag payment',
      isAnomaly: false,
    });

    await Expense.create({
      vehicle: v2._id,
      category: 'Permits',
      amount: 1500, // INR
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      description: 'State crossing border commercial permit fees',
      isAnomaly: false,
    });

    // ANOMALY Expense: A Tolls fee of ₹4,800 (Normal tolls are ₹450).
    await Expense.create({
      vehicle: v1._id,
      category: 'Tolls',
      amount: 4800, // INR
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: 'Express highway crossing penalty and toll fee',
      isAnomaly: true,
      anomalyReason: 'Expense amount (₹4,800) is more than double the rolling average (₹450.00) for category: Tolls.',
    });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
