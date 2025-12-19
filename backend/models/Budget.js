// models/Budget.js - SIMPLIFIED VERSION
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'salary', 'allowance', 'scholarship', 'freelance', 'investment', 'gift', 'other_income',
      // Expense categories
      'tuition_fees', 'books_supplies', 'rent', 'utilities', 'food_groceries', 
      'transportation', 'entertainment', 'shopping', 'healthcare', 'subscriptions', 
      'dining_out', 'other_expense'
    ]
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
    default: ''
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', null],
      default: null
    },
    nextDate: {
      type: Date,
      default: null
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile_banking', 'online_transfer', 'other', null],
    default: null
  },
  isEssential: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Define indexes
transactionSchema.index({ studentId: 1, date: -1 });
transactionSchema.index({ email: 1, type: 1 });
transactionSchema.index({ category: 1 });

// Virtual for formatted date
transactionSchema.virtual('formattedDate').get(function() {
  if (!this.date) return '';
  const date = new Date(this.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

// Static method to get budget summary
transactionSchema.statics.getBudgetSummary = async function(userId, startDate, endDate) {
  const matchStage = {
    studentId: new mongoose.Types.ObjectId(userId),
    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'income'] }, '$totalAmount', 0]
          }
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'expense'] }, '$totalAmount', 0]
          }
        },
        incomeCount: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'income'] }, '$count', 0]
          }
        },
        expenseCount: {
          $sum: {
            $cond: [{ $eq: ['$_id', 'expense'] }, '$count', 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalIncome: { $round: ['$income', 2] },
        totalExpense: { $round: ['$expense', 2] },
        balance: { $round: [{ $subtract: ['$income', '$expense'] }, 2] },
        incomeCount: 1,
        expenseCount: 1
      }
    }
  ]);

  return result[0] || {
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0
  };
};

// Static method to get monthly breakdown
transactionSchema.statics.getMonthlyBreakdown = async function(userId, months = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return await this.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          type: '$type'
        },
        totalAmount: { $sum: '$amount' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          year: '$_id.year',
          month: '$_id.month'
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'income'] }, '$totalAmount', 0]
          }
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$totalAmount', 0]
          }
        },
        incomeCount: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'income'] }, '$transactionCount', 0]
          }
        },
        expenseCount: {
          $sum: {
            $cond: [{ $eq: ['$_id.type', 'expense'] }, '$transactionCount', 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        income: { $round: ['$income', 2] },
        expense: { $round: ['$expense', 2] },
        balance: { $round: [{ $subtract: ['$income', '$expense'] }, 2] },
        incomeCount: 1,
        expenseCount: 1
      }
    },
    { $sort: { year: -1, month: -1 } }
  ]);
};

module.exports = mongoose.model('Budget', transactionSchema);