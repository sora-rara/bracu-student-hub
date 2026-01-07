// models/BudgetGoals.js
const mongoose = require('mongoose');

const budgetGoalsSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  monthlyBudget: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  monthlyIncome: {
    type: Number,
    min: 0,
    default: 0
  },
  savingsGoal: {
    type: Number,
    min: 0,
    default: 0
  },
  currentBalance: {
    type: Number,
    default: 0
  },
  totalIncome: {
    type: Number,
    min: 0,
    default: 0
  },
  totalExpenses: {
    type: Number,
    min: 0,
    default: 0
  },
  expenseLimits: {
    food_groceries: { type: Number, min: 0, default: 0 },
    transportation: { type: Number, min: 0, default: 0 },
    entertainment: { type: Number, min: 0, default: 0 },
    shopping: { type: Number, min: 0, default: 0 },
    bills: { type: Number, min: 0, default: 0 },
    education: { type: Number, min: 0, default: 0 },
    tuition_fees: { type: Number, min: 0, default: 0 },
    rent: { type: Number, min: 0, default: 0 },
    utilities: { type: Number, min: 0, default: 0 },
    healthcare: { type: Number, min: 0, default: 0 },
    subscriptions: { type: Number, min: 0, default: 0 },
    dining_out: { type: Number, min: 0, default: 0 },
    other_expense: { type: Number, min: 0, default: 0 }
  },
  notifications: {
    spendingAlerts: { type: Boolean, default: true },
    goalProgress: { type: Boolean, default: true },
    monthlySummary: { type: Boolean, default: true },
    overspendingAlert: { type: Boolean, default: true },
    budgetReminder: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

//budgetGoalsSchema.index({ studentId: 1 });

module.exports = mongoose.model('BudgetGoals', budgetGoalsSchema);