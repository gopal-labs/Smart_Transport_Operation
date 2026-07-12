const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    enum: ['Tolls', 'Maintenance', 'Permits', 'Other'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
  },
  isAnomaly: {
    type: Boolean,
    default: false,
  },
  anomalyReason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
