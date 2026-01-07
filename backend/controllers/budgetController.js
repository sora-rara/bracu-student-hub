// controllers/budgetController.js
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const User = require('../models/User');
const BudgetGoals = require('../models/BudgetGoals');

// Helper function to parse date string to local Date object (start of day)
const parseDateToLocal = (dateString) => {
  if (!dateString) return null;
  
  console.log('🔄 Parsing date:', dateString, 'Type:', typeof dateString);
  
  // If it's already a Date object
  if (dateString instanceof Date) {
    return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate());
  }
  
  // If it's in YYYY-MM-DD format
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // If it's in MM/DD/YYYY format (common frontend format)
  if (typeof dateString === 'string' && dateString.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }
  
  // Try to parse as ISO string or any other Date format
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  } catch (error) {
    console.error('Error parsing date:', error);
  }
  
  console.log('⚠️ Could not parse date:', dateString);
  return null;
};

// Helper function to format date for response
const formatDateForResponse = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Create new transaction - SIMPLIFIED FIXED VERSION
// @route   POST /api/budget/transactions
// @access  Private
exports.createTransaction = async (req, res) => {
  try {
    console.log('➕ Creating new transaction');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    console.log('User ID for transaction:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in first.',
        debug: {
          hasSession: !!req.session,
          sessionUserId: req.session?.userId,
          reqUserId: req.userId,
          reqUser: req.user
        }
      });
    }

    let user;
    try {
      user = await User.findById(userId);
      console.log('Found user:', user?.email);
    } catch (userError) {
      console.error('Error finding user:', userError);
      // Continue with session data if user not found in DB
    }

    // Basic validation
    const { amount, type, category, description = '', date } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "income" or "expense"'
      });
    }
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    console.log('📅 Incoming date from frontend:', date);
    
    let transactionDate;
    
    if (date) {
      transactionDate = parseDateToLocal(date);
      
      if (!transactionDate || isNaN(transactionDate.getTime())) {
        console.log('❌ Invalid date format:', date);
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Please use YYYY-MM-DD format.'
        });
      }
    } else {
      // Default to today at start of day
      const today = new Date();
      transactionDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    
    console.log('✅ Final transaction date (local):', transactionDate.toISOString());

    // Create transaction data - SIMPLIFIED: Use the date as-is
    const transactionData = {
      studentId: new mongoose.Types.ObjectId(userId),
      email: user?.email || req.session?.email || 'unknown@example.com',
      amount: parseFloat(amount),
      type,
      category,
      description: description?.toString() || '',
      date: transactionDate, // Use the date directly
      // Include optional fields if provided
      ...(req.body.tags && { tags: req.body.tags }),
      ...(req.body.paymentMethod && { paymentMethod: req.body.paymentMethod }),
      ...(req.body.isEssential !== undefined && { isEssential: Boolean(req.body.isEssential) }),
      ...(req.body.recurring && { recurring: req.body.recurring })
    };

    console.log('📤 Creating transaction with data:', transactionData);
    
    // Create transaction WITHOUT pre-save middleware interfering
    // Create a simple document directly
    const transaction = new Budget(transactionData);
    
    // Save the transaction
    await transaction.save();
    
    console.log('✅ Transaction created successfully:', transaction._id);
    
    // Update budget goals with new totals
    try {
      await updateBudgetTotals(userId);
    } catch (goalError) {
      console.log('⚠️ Could not update budget goals:', goalError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        _id: transaction._id,
        studentId: transaction.studentId,
        email: transaction.email,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        date: formatDateForResponse(transaction.date),
        formattedDate: new Date(transaction.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate transaction detected'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all transactions for a user
// @route   GET /api/budget/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    console.log('📊 Getting transactions for user');
    
    const { startDate, endDate, type, category, limit = 50, page = 1 } = req.query;
    
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    console.log('User ID found:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in first.'
      });
    }

    // Build query
    const query = { studentId: new mongoose.Types.ObjectId(userId) };
    
    if (startDate && endDate) {
      const start = parseDateToLocal(startDate);
      const end = parseDateToLocal(endDate);
      
      if (start && end) {
        query.date = {
          $gte: start,
          $lte: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
        };
      }
    }
    
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }
    
    if (category) {
      query.category = category;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Query:', JSON.stringify(query, null, 2));
    
    const transactions = await Budget.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format dates for frontend
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      date: formatDateForResponse(transaction.date),
      formattedDate: transaction.date ? 
        new Date(transaction.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : ''
    }));

    const total = await Budget.countDocuments(query);

    // Calculate totals for this query
    const totals = await Budget.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    
    totals.forEach(item => {
      if (item._id === 'income') {
        totalIncome = item.total;
      } else if (item._id === 'expense') {
        totalExpenses = item.total;
      }
    });

    const currentBalance = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        totals: {
          totalIncome: parseFloat(totalIncome.toFixed(2)),
          totalExpenses: parseFloat(totalExpenses.toFixed(2)),
          currentBalance: parseFloat(currentBalance.toFixed(2))
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions',
      error: error.message
    });
  }
};

// @desc    Get budget summary (income, expense, balance)
// @route   GET /api/budget/summary
// @access  Private
exports.getBudgetSummary = async (req, res) => {
  try {
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { startDate, endDate, period = 'month' } = req.query;
    
    let queryStartDate, queryEndDate;
    
    // Set date range based on period
    if (startDate && endDate) {
      queryStartDate = parseDateToLocal(startDate);
      queryEndDate = parseDateToLocal(endDate);
    } else {
      // Default to current month
      queryStartDate = new Date();
      queryStartDate.setDate(1);
      queryStartDate.setHours(0, 0, 0, 0);
      
      queryEndDate = new Date();
      queryEndDate.setMonth(queryEndDate.getMonth() + 1);
      queryEndDate.setDate(0);
      queryEndDate.setHours(23, 59, 59, 999);
    }

    console.log('📊 Getting budget summary for date range:', {
      start: queryStartDate.toISOString(),
      end: queryEndDate.toISOString()
    });
    
    const summary = await Budget.getBudgetSummary(userId, queryStartDate, queryEndDate);
    
    // Calculate budget recommendations
    const recommendations = generateBudgetRecommendations(summary);

    // Get budget goals
    let goals;
    try {
      goals = await BudgetGoals.findOne({ studentId: userId });
    } catch (goalError) {
      console.log('⚠️ Could not fetch budget goals:', goalError.message);
      goals = null;
    }

    res.json({
      success: true,
      data: {
        summary,
        totals: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          balance: summary.balance
        },
        goals: goals || {
          monthlyBudget: 0,
          monthlyIncome: 0,
          savingsGoal: 0,
          currentBalance: 0,
          totalIncome: 0,
          totalExpenses: 0
        },
        dateRange: {
          startDate: queryStartDate,
          endDate: queryEndDate
        },
        recommendations
      }
    });
  } catch (error) {
    console.error('❌ Error getting budget summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get budget goals
// @route   GET /api/budget/goals
// @access  Private
exports.getBudgetGoals = async (req, res) => {
  try {
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    let goals;
    try {
      goals = await BudgetGoals.findOne({ studentId: userId });
    } catch (error) {
      console.log('⚠️ Could not fetch budget goals:', error.message);
      goals = null;
    }
    
    // If no goals exist, return default structure with calculated totals
    if (!goals) {
      // Calculate current totals
      const totals = await calculateCurrentTotals(userId);
      
      return res.json({
        success: true,
        data: {
          monthlyBudget: 0,
          monthlyIncome: 0,
          savingsGoal: 0,
          currentBalance: totals.currentBalance,
          totalIncome: totals.totalIncome,
          totalExpenses: totals.totalExpenses,
          expenseLimits: {},
          notifications: {
            spendingAlerts: true,
            goalProgress: true,
            monthlySummary: true
          }
        }
      });
    }
    
    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('❌ Error getting budget goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch budget goals',
      error: error.message
    });
  }
};

// @desc    Set/update budget goals
// @route   POST /api/budget/goals
// @access  Private
exports.setBudgetGoals = async (req, res) => {
  try {
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let user;
    try {
      user = await User.findById(userId);
    } catch (userError) {
      console.error('Error finding user:', userError);
      user = null;
    }

    const { monthlyBudget, monthlyIncome, savingsGoal, expenseLimits, notifications } = req.body;
    
    // Validate input
    if (monthlyBudget !== undefined && monthlyBudget < 0) {
      return res.status(400).json({
        success: false,
        message: 'Monthly budget cannot be negative'
      });
    }
    
    if (monthlyIncome !== undefined && monthlyIncome < 0) {
      return res.status(400).json({
        success: false,
        message: 'Monthly income cannot be negative'
      });
    }
    
    if (savingsGoal !== undefined && savingsGoal < 0) {
      return res.status(400).json({
        success: false,
        message: 'Savings goal cannot be negative'
      });
    }

    // Calculate current totals
    const totals = await calculateCurrentTotals(userId);

    // Create or update goals
    const goals = await BudgetGoals.findOneAndUpdate(
      { studentId: userId },
      {
        studentId: userId,
        email: user?.email || req.session?.email || 'unknown@example.com',
        monthlyBudget: monthlyBudget || 0,
        monthlyIncome: monthlyIncome || 0,
        savingsGoal: savingsGoal || 0,
        currentBalance: totals.currentBalance,
        totalIncome: totals.totalIncome,
        totalExpenses: totals.totalExpenses,
        expenseLimits: expenseLimits || {},
        notifications: notifications || {
          spendingAlerts: true,
          goalProgress: true,
          monthlySummary: true
        },
        lastUpdated: new Date()
      },
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: 'Budget goals saved successfully',
      data: goals
    });
  } catch (error) {
    console.error('❌ Error setting budget goals:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to save budget goals',
      error: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/budget/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res) => {
  try {
    console.log('🔄 Updating transaction:', req.params.id);
    
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let transaction = await Budget.findOne({
      _id: req.params.id,
      studentId: userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Handle date update
    const updateData = { ...req.body };
    if (updateData.date) {
      const parsedDate = parseDateToLocal(updateData.date);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        updateData.date = parsedDate;
      } else {
        delete updateData.date;
      }
    }

    // Update transaction
    transaction = await Budget.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Update budget goals with new totals
    try {
      await updateBudgetTotals(userId);
    } catch (goalError) {
      console.log('⚠️ Could not update budget goals:', goalError.message);
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        ...transaction.toObject(),
        date: formatDateForResponse(transaction.date)
      }
    });
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/budget/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res) => {
  try {
    // Get userId - try multiple sources
    let userId = req.userId || (req.user && req.user._id) || req.session.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const transaction = await Budget.findOneAndDelete({
      _id: req.params.id,
      studentId: userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update budget goals with new totals
    try {
      await updateBudgetTotals(userId);
    } catch (goalError) {
      console.log('⚠️ Could not update budget goals:', goalError.message);
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Helper function to calculate current totals
async function calculateCurrentTotals(userId) {
  try {
    const totals = await Budget.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    
    totals.forEach(item => {
      if (item._id === 'income') {
        totalIncome = item.total;
      } else if (item._id === 'expense') {
        totalExpenses = item.total;
      }
    });

    const currentBalance = totalIncome - totalExpenses;

    return {
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      currentBalance: parseFloat(currentBalance.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating totals:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      currentBalance: 0
    };
  }
}

// Helper function to update budget totals
async function updateBudgetTotals(userId) {
  try {
    const totals = await calculateCurrentTotals(userId);
    
    await BudgetGoals.findOneAndUpdate(
      { studentId: userId },
      {
        $set: {
          totalIncome: totals.totalIncome,
          totalExpenses: totals.totalExpenses,
          currentBalance: totals.currentBalance,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error updating budget totals:', error);
  }
}

// Helper function to generate budget recommendations
function generateBudgetRecommendations(summary) {
  const recommendations = [];
  const balance = summary.balance;
  
  if (balance < 0) {
    recommendations.push({
      type: 'warning',
      title: 'Negative Balance',
      message: `You're spending ${Math.abs(balance).toFixed(2)} more than you earn. Consider reducing expenses.`,
      suggestion: 'Review your non-essential expenses'
    });
  }
  
  if (summary.expenseCount > 20) {
    recommendations.push({
      type: 'info',
      title: 'High Transaction Count',
      message: `You have ${summary.expenseCount} expense transactions. Consider consolidating small purchases.`,
      suggestion: 'Track small expenses as a group'
    });
  }
  
  if (summary.incomeCount === 0 && summary.totalIncome === 0) {
    recommendations.push({
      type: 'warning',
      title: 'No Income Recorded',
      message: 'You haven\'t recorded any income. Make sure to track all your income sources.',
      suggestion: 'Add your income sources'
    });
  }
  
  // Savings recommendation
  if (balance > 1000) {
    recommendations.push({
      type: 'success',
      title: 'Good Savings Potential',
      message: `You have a surplus of ${balance.toFixed(2)}. Consider setting aside ${(balance * 0.2).toFixed(2)} for savings.`,
      suggestion: 'Start a savings goal'
    });
  }
  
  return recommendations;
}

// Export helper functions for testing
exports._parseDateToLocal = parseDateToLocal;
exports._formatDateForResponse = formatDateForResponse;