const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const { protect } = require('../middleware/auth');

const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const FuelLog = require('../models/FuelLog');
const Expense = require('../models/Expense');

// @desc    Chat with AI assistant about TransitOps data
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing messages array' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_actual_openai_api_key')) {
      return res.status(200).json({ 
        success: true, 
        response: `**Setup Notice**: The OpenAI API Key is currently not set or is using the placeholder value. Please open \`server/.env\` and add your \`OPENAI_API_KEY\` to enable active AI responses!` 
      });
    }

    // Fetch database docs dynamically to build prompt context
    const vehicles = await Vehicle.find({});
    const drivers = await Driver.find({});
    const trips = await Trip.find({}).populate('vehicle').populate('driver');
    const fuelLogs = await FuelLog.find({ isAnomaly: true }).populate('vehicle');
    const expenses = await Expense.find({ isAnomaly: true }).populate('vehicle');

    // Make concise summary data
    const vehicleSummary = vehicles.map(v => {
      // Calculate risk score based on service odometer
      const milesSinceService = v.odometer - v.lastServiceOdometer;
      const riskScore = Math.min(100, Math.max(0, Math.round((milesSinceService / 12000) * 100)));
      return `- ${v.name} (${v.registrationNumber}): Status: ${v.status}, Odometer: ${v.odometer} km, Maintenance Risk Index: ${riskScore}%`;
    }).join('\n');

    const driverSummary = drivers.map(d => 
      `- ${d.name}: Status: ${d.status}, License: ${d.licenseNumber} (${d.licenseCategory}), Safety Score: ${d.safetyScore}/100, Completed Trips: ${d.completedTripsCount}`
    ).join('\n');

    const tripSummary = trips.map(t => 
      `- ${t.tripId}: Route: ${t.source} -> ${t.destination}, Distance: ${t.plannedDistance} km, Status: ${t.status}, Vehicle: ${t.vehicle ? t.vehicle.name : 'N/A'}, Driver: ${t.driver ? t.driver.name : 'N/A'}`
    ).join('\n');

    const anomalySummary = [
      ...fuelLogs.map(f => `- [FUEL ANOMALY] Vehicle ${f.vehicle ? f.vehicle.name : 'Unknown'}: Refueled ${f.liters}L on odometer ${f.odometer} km. Reason: ${f.anomalyReason}`),
      ...expenses.map(e => `- [EXPENSE ANOMALY] Vehicle ${e.vehicle ? e.vehicle.name : 'Unknown'}: ₹${e.amount} in category ${e.category}. Description: ${e.description}. Reason: ${e.anomalyReason}`)
    ].join('\n');

    const dbContext = `
Active Vehicles in Registry:
${vehicleSummary || 'None'}

Drivers Roster:
${driverSummary || 'None'}

Trip Operations:
${tripSummary || 'None'}

Anomalous Incidents flagged:
${anomalySummary || 'None'}
`;

    // System prompt instruction
    const systemInstruction = {
      role: 'system',
      content: `You are the TransitOps AI Assistant, a friendly and highly knowledgeable copilot for the TransitOps Transport Operations Platform.
You have real-time access to the TransitOps database context.
Here is the current live data in the system:
------------------------------------------
${dbContext}
------------------------------------------

Instructions:
1. Speak in friendly, professional, but clear and human-like English.
2. Refer to Indian locations, vehicle models, and driver names accurately based on the live context.
3. Be helpful, concise, and explain reasons clearly (such as why a vehicle has a high maintenance risk score, or what an anomaly flag indicates).
4. Do not make up fake statuses or vehicles. If a vehicle or driver isn't mentioned in the live context list, state that it's not found in our registry.
5. Keep answers formatting clean and easy to read using markdown.`
    };

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemInstruction, ...messages],
      temperature: 0.7,
    });

    const aiMessage = response.choices[0].message.content;
    res.json({ success: true, response: aiMessage });

  } catch (error) {
    console.error('OpenAI backend error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error communicating with AI assistant' });
  }
});

module.exports = router;
