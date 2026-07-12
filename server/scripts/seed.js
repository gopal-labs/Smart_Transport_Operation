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
    // Seed Users (passwords will be hashed in pre-save)
    const manager = await User.create({
      name: 'Rahul Kumar',
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
    // Seed Vehicles
    const v1 = await Vehicle.create({
      registrationNumber: 'TX-98A-1201',
      name: 'Freightliner Cascadia Semi',
      type: 'Semi',
      maxLoadCapacity: 20000,
      odometer: 145200,
      lastServiceOdometer: 142000,
      acquisitionCost: 120000,
      status: 'Available',
    });

    const v2 = await Vehicle.create({
      registrationNumber: 'CA-33B-4402',
      name: 'Ford Transit Cargo Van',
      type: 'Van',
      maxLoadCapacity: 4500,
      odometer: 85500,
      lastServiceOdometer: 74000, // 11,500 mi since service -> High Maintenance Risk Score (> 80%)
      acquisitionCost: 45000,
      status: 'Available',
    });

    const v3 = await Vehicle.create({
      registrationNumber: 'NY-44X-5603',
      name: 'Isuzu NPR Box Truck',
      type: 'Box Truck',
      maxLoadCapacity: 8000,
      odometer: 32400,
      lastServiceOdometer: 32400,
      acquisitionCost: 65000,
      status: 'In Shop', // Vehicle matches its active maintenance log
    });

    const v4 = await Vehicle.create({
      registrationNumber: 'FL-22Y-9904',
      name: 'Peterbilt 579 Semi',
      type: 'Semi',
      maxLoadCapacity: 22000,
      odometer: 12800,
      lastServiceOdometer: 10000,
      acquisitionCost: 140000,
      status: 'Available',
    });

    const v5 = await Vehicle.create({
      registrationNumber: 'IL-55Z-7705',
      name: 'GMC Savana Cargo',
      type: 'Van',
      maxLoadCapacity: 4000,
      odometer: 235000,
      lastServiceOdometer: 225000,
      acquisitionCost: 35000,
      status: 'Retired',
    });

    console.log('Creating Drivers...');
    // Seed Drivers
    const expiryFuture = new Date();
    expiryFuture.setFullYear(expiryFuture.getFullYear() + 2);

    const expiryPast = new Date();
    expiryPast.setDate(expiryPast.getDate() - 15); // expired 15 days ago

    const d1 = await Driver.create({
      name: 'John Doe',
      licenseNumber: 'DL-TX983471',
      licenseCategory: 'CDL-A',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+1-555-0101',
      safetyScore: 92,
      status: 'Available',
      completedTripsCount: 45,
      user: driverUser._id, // Linked to the driver user
    });

    const d2 = await Driver.create({
      name: 'Jane Smith',
      licenseNumber: 'DL-CA882190',
      licenseCategory: 'CDL-A',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+1-555-0102',
      safetyScore: 98,
      status: 'Available',
      completedTripsCount: 68,
    });

    const d3 = await Driver.create({
      name: 'Robert Johnson',
      licenseNumber: 'DL-NY552890',
      licenseCategory: 'CDL-B',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+1-555-0103',
      safetyScore: 65,
      status: 'Available',
      completedTripsCount: 22,
    });

    const d4 = await Driver.create({
      name: 'Alice Brown',
      licenseNumber: 'DL-FL112233',
      licenseCategory: 'CDL-A',
      licenseExpiryDate: expiryFuture,
      contactNumber: '+1-555-0104',
      safetyScore: 85,
      status: 'Suspended', // Driver suspended
      completedTripsCount: 15,
    });

    const d5 = await Driver.create({
      name: 'Tom Davis',
      licenseNumber: 'DL-IL992255',
      licenseCategory: 'CDL-B',
      licenseExpiryDate: expiryPast, // License is expired
      contactNumber: '+1-555-0105',
      safetyScore: 90,
      status: 'Available',
      completedTripsCount: 30,
    });

    console.log('Creating Maintenance Logs...');
    // Seed Active Maintenance for v3
    await MaintenanceLog.create({
      vehicle: v3._id,
      description: 'Engine transmission fluid flush & brake rotor replacement',
      cost: 1450,
      startDate: new Date(),
      status: 'Active',
    });

    // Seed Completed Maintenance for v1
    await MaintenanceLog.create({
      vehicle: v1._id,
      description: 'Scheduled preventive maintenance service & inspection',
      cost: 450,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      status: 'Completed',
    });

    console.log('Creating Trips...');
    // Completed trip 1
    const t1 = await Trip.create({
      tripId: 'TRIP-1001',
      source: 'Houston, TX',
      destination: 'Dallas, TX',
      vehicle: v1._id,
      driver: d1._id,
      cargoWeight: 15000,
      plannedDistance: 240,
      weather: 'Clear',
      status: 'Completed',
      riskScore: 25,
      actualFuelUsed: 28, // Gallons
      co2Emissions: Math.round(28 * 10.18),
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000),
    });

    // Completed trip 2
    const t2 = await Trip.create({
      tripId: 'TRIP-1002',
      source: 'Los Angeles, CA',
      destination: 'Las Vegas, NV',
      vehicle: v2._id,
      driver: d2._id,
      cargoWeight: 3000,
      plannedDistance: 270,
      weather: 'Rain',
      status: 'Completed',
      riskScore: 35,
      actualFuelUsed: 20,
      co2Emissions: Math.round(20 * 10.18),
      dispatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000),
    });

    // Active dispatched trip
    const t3 = await Trip.create({
      tripId: 'TRIP-1003',
      source: 'Atlanta, GA',
      destination: 'Orlando, FL',
      vehicle: v4._id,
      driver: d3._id,
      cargoWeight: 18000,
      plannedDistance: 440,
      weather: 'Fog',
      status: 'Dispatched',
      riskScore: 52,
      dispatchedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Dispatched 4 hours ago
    });

    // Draft / Pending trip
    const t4 = await Trip.create({
      tripId: 'TRIP-1004',
      source: 'Miami, FL',
      destination: 'Tampa, FL',
      vehicle: v1._id,
      driver: d1._id,
      cargoWeight: 14000,
      plannedDistance: 280,
      weather: 'Clear',
      status: 'Draft',
      riskScore: 28,
    });

    console.log('Creating Fuel Logs & Expenses (with anomalies)...');
    // Normal Fuel logs
    await FuelLog.create({
      vehicle: v1._id,
      odometer: 142240,
      liters: 106, // approx 28 gallons
      cost: 112,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      isAnomaly: false,
    });

    await FuelLog.create({
      vehicle: v2._id,
      odometer: 74270,
      liters: 75.7, // approx 20 gallons
      cost: 95,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isAnomaly: false,
    });

    // ANOMALY Fuel log: vehicle 1 refueling odometer goes up, but liters is very low, or efficiency is extremely bad.
    // Let's create an anomaly fuel log: 150 liters filled but odometer only advanced by 30 miles (efficiency = 0.2 mi/L, typical is 2.3 mi/L)
    await FuelLog.create({
      vehicle: v1._id,
      odometer: 142270,
      liters: 150,
      cost: 195,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isAnomaly: true,
      anomalyReason: 'Fuel efficiency is 91% below vehicle\'s historical average (0.20 vs 2.26 mi/L). Possible fuel leak, theft, or odometer error.',
    });

    // Normal Expenses
    await Expense.create({
      vehicle: v1._id,
      category: 'Tolls',
      amount: 45,
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      description: 'Houston-Dallas I-45 Toll tag payment',
      isAnomaly: false,
    });

    await Expense.create({
      vehicle: v2._id,
      category: 'Permits',
      amount: 150,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      description: 'State crossing permit fees',
      isAnomaly: false,
    });

    // ANOMALY Expense: A Tolls fee of $480 (Normal tolls are $45).
    await Expense.create({
      vehicle: v1._id,
      category: 'Tolls',
      amount: 480,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      description: 'Express highway crossing penalty and toll fee',
      isAnomaly: true,
      anomalyReason: 'Expense amount ($480) is more than double the rolling average ($45.00) for category: Tolls.',
    });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
