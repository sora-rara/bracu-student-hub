// src/pages/BudgetPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/auth';
import BudgetSummary from '../components/Budget/BudgetSummary';
import TransactionList from '../components/Budget/TransactionList';
import MonthlyChart from '../components/Budget/MonthlyChart';
import TransactionForm from '../components/Budget/TransactionForm';
import budgetApi from '../api/budget';
import '../App.css';

const BudgetPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [budget, setBudget] = useState({
    monthlyBudget: 0,
    monthlyIncome: 0,
    savingsGoal: 0,
    currentBalance: 0,
    totalIncome: 0,
    totalExpenses: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    if (!currentUser) {
      setError('Please log in to view budget information');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 Fetching budget data for user:', currentUser.email);
      
      // Fetch all data
      const [transactionsRes, summaryRes, goalsRes] = await Promise.all([
        budgetApi.getTransactions({ limit: 200 }),
        budgetApi.getSummary(),
        budgetApi.getGoals()
      ]);

      console.log('📊 Transactions response:', transactionsRes.data);
      console.log('📊 Summary response:', summaryRes.data);
      console.log('📊 Goals response:', goalsRes.data);

      // Handle transactions
      let transactionList = [];
      if (transactionsRes.data) {
        const data = transactionsRes.data;
        
        if (data.success) {
          // New API format
          if (Array.isArray(data.data)) {
            transactionList = data.data;
          } else if (data.data && Array.isArray(data.data.transactions)) {
            transactionList = data.data.transactions;
          } else if (data.data && Array.isArray(data.data.data)) {
            transactionList = data.data.data;
          }
        } else if (Array.isArray(data)) {
          // Direct array response
          transactionList = data;
        } else if (data && Array.isArray(data.transactions)) {
          transactionList = data.transactions;
        }
      }
      
      // Sort transactions by date (newest first) and format dates
      const sortedTransactions = transactionList
        .map(transaction => {
          // Format date properly for display
          const formattedDate = formatDateForDisplay(transaction.date);
          return {
            ...transaction,
            date: formattedDate,
            // Add a formatted date string for easier debugging
            formattedDateString: formattedDate
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setTransactions(sortedTransactions);
      setAllTransactions(sortedTransactions);
      console.log(`📊 Loaded ${sortedTransactions.length} transactions`);

      // Handle budget data
      let mergedBudgetData = {
        monthlyBudget: 0,
        monthlyIncome: 0,
        savingsGoal: 0,
        currentBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
      };

      // Merge goals data
      if (goalsRes.data) {
        const goalsData = goalsRes.data.success ? (goalsRes.data.data || goalsRes.data) : goalsRes.data;
        mergedBudgetData = {
          ...mergedBudgetData,
          monthlyBudget: goalsData.monthlyBudget || 0,
          monthlyIncome: goalsData.monthlyIncome || 0,
          savingsGoal: goalsData.savingsGoal || 0
        };
      }

      // Merge summary data
      if (summaryRes.data) {
        const summaryData = summaryRes.data.success ? (summaryRes.data.data || summaryRes.data) : summaryRes.data;
        const totals = summaryData.totals || {};
        const summary = summaryData.summary || summaryData;
        
        mergedBudgetData = {
          ...mergedBudgetData,
          currentBalance: totals.balance || summary.balance || summary.currentBalance || 0,
          totalIncome: totals.totalIncome || summary.totalIncome || 0,
          totalExpenses: totals.totalExpense || summary.totalExpenses || summary.totalExpense || 0
        };
      }

      setBudget(mergedBudgetData);
      console.log('📊 Budget data set:', mergedBudgetData);
      
    } catch (err) {
      console.error('❌ Budget fetch error:', err);
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       'Failed to load budget data.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      // If already in YYYY-MM-DD format, return as is
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
      }
      
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
    }
    
    // Return today's date as fallback
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📝 Adding transaction:', transactionData);
      
      // Validate required fields
      if (!transactionData.amount || transactionData.amount <= 0) {
        setError('Please enter a valid amount greater than 0');
        setLoading(false);
        return;
      }

      if (!transactionData.date) {
        setError('Please select a date');
        setLoading(false);
        return;
      }

      // DEBUG: Check the date format before sending
      console.log('📅 Transaction date debug:', {
        original: transactionData.date,
        dateType: typeof transactionData.date,
        parsedDate: new Date(transactionData.date),
        isoString: new Date(transactionData.date).toISOString(),
        localDateString: new Date(transactionData.date).toLocaleDateString()
      });

      // Format the transaction data for backend
      const formattedData = {
        ...transactionData,
        studentId: currentUser._id,
        email: currentUser.email,
        name: currentUser.name || 'Student',
        // Ensure amount is a number
        amount: parseFloat(transactionData.amount),
        // Send date as is (YYYY-MM-DD format)
        date: transactionData.date
      };

      console.log('📤 Sending to API:', formattedData);

      const result = await budgetApi.createTransaction(formattedData);
      console.log('✅ API Response:', result.data);

      if (result.data && result.data.success) {
        const successMessage = result.data.message || 'Transaction added successfully!';
        setSuccess(successMessage);
        await fetchBudgetData(); // Refresh data
        setShowTransactionForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = result.data?.message || 'Failed to add transaction';
        setError(`API Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('❌ Add transaction error:', err);
      
      // Extract error message from response
      let errorMsg = 'Failed to add transaction';
      if (err.response) {
        const data = err.response.data;
        console.log('📊 Error response details:', data);
        
        if (data && data.message) {
          errorMsg = data.message;
          // Check for future date error
          if (errorMsg.includes('future') || errorMsg.includes('Future')) {
            errorMsg += ' Please select today or a past date.';
          }
        } else if (data && data.error) {
          errorMsg = data.error;
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTransaction = async (id, transactionData) => {
    try {
      setLoading(true);
      setError('');
      
      const formattedData = {
        ...transactionData,
        amount: parseFloat(transactionData.amount),
        date: transactionData.date
      };

      console.log('📝 Updating transaction:', id, formattedData);
      const result = await budgetApi.updateTransaction(id, formattedData);

      if (result.data && result.data.success) {
        const successMessage = result.data.message || 'Transaction updated successfully!';
        setSuccess(successMessage);
        await fetchBudgetData();
        setEditingTransaction(null);
        setShowTransactionForm(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = result.data?.message || 'Failed to update transaction';
        setError(`API Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('❌ Update transaction error:', err);
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       'Failed to update transaction';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      setLoading(true);
      console.log('🗑️ Deleting transaction:', id);
      const result = await budgetApi.deleteTransaction(id);

      if (result.data && result.data.success) {
        const successMessage = result.data.message || 'Transaction deleted successfully!';
        setSuccess(successMessage);
        await fetchBudgetData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = result.data?.message || 'Failed to delete transaction';
        setError(`API Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('❌ Delete error:', err);
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       'Failed to delete transaction';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (budgetData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('💰 Setting budget goals:', budgetData);
      
      const result = await budgetApi.setGoals({
        ...budgetData,
        studentId: currentUser._id,
        email: currentUser.email
      });

      console.log('✅ Budget set response:', result.data);

      if (result.data && result.data.success) {
        const successMessage = result.data.message || 'Budget goals set successfully!';
        setSuccess(successMessage);
        
        // Update local state
        setBudget(prev => ({
          ...prev,
          ...budgetData
        }));
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorMsg = result.data?.message || 'Failed to set budget';
        setError(`API Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error('❌ Set budget error:', err);
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error || 
                       err.message || 
                       'Failed to set budget';
      setError(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    console.log('✏️ Editing transaction:', transaction);
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleExport = () => {
    if (allTransactions.length === 0) {
      setError('No transactions to export');
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Date,Type,Category,Amount,Description"]
      .concat(allTransactions.map(t => 
        `${t.date},${t.type},${t.category},${t.amount},"${t.description || ''}"`
      ))
      .join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `budget_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewAll = () => {
    setShowAllTransactions(!showAllTransactions);
  };

  // Get transactions to display
  const displayTransactions = showAllTransactions 
    ? allTransactions 
    : allTransactions.slice(0, 10);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading budget data...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="auth-error">
        <h3>Authentication Required</h3>
        <p>Please log in to view budget information</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="budget-page">
      <div className="budget-page-header">
        <h1>Budget Dashboard</h1>
        <p>Track and manage your monthly expenses and income</p>
        
        {error && (
          <div className="alert alert-danger alert-dismissible">
            <strong>Error:</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success alert-dismissible">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}

        <div className="budget-page-actions">
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingTransaction(null);
              setShowTransactionForm(true);
            }}
            disabled={loading}
          >
            {loading ? 'Loading...' : '+ Add Transaction'}
          </button>
          <button className="btn btn-outline" onClick={handleExport} disabled={allTransactions.length === 0}>
            Export Data
          </button>
          <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="budget-page-grid">
        <div className="budget-summary-section card">
          <BudgetSummary 
            onSetBudget={handleSetBudget}
          />
        </div>

        <div className="monthly-chart-section card">
          <MonthlyChart transactions={allTransactions} />
        </div>

        <div className="transaction-list-section card">
          <div className="transaction-header">
            <h2 className="card-title">
              {showAllTransactions ? 'All Transactions' : 'Recent Transactions'}
            </h2>
            <button 
              className="btn btn-sm btn-outline" 
              onClick={handleViewAll}
              disabled={allTransactions.length === 0}
            >
              {showAllTransactions ? 'Show Recent' : 'View All'}
            </button>
          </div>
          
          <TransactionList 
            transactions={displayTransactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />

          {displayTransactions.length === 0 && (
            <div className="empty-state">
              <p>No transactions found. Add your first transaction!</p>
              <button 
                className="btn btn-primary mt-2"
                onClick={() => {
                  setEditingTransaction(null);
                  setShowTransactionForm(true);
                }}
              >
                + Add Your First Transaction
              </button>
            </div>
          )}

          {!showAllTransactions && allTransactions.length > 10 && (
            <div className="view-all-footer">
              <p>Showing 10 of {allTransactions.length} transactions</p>
            </div>
          )}
        </div>
      </div>

      {showTransactionForm && (
        <TransactionForm 
          onClose={() => {
            setShowTransactionForm(false);
            setEditingTransaction(null);
            setError('');
          }}
          onSubmit={editingTransaction ? 
            (data) => handleUpdateTransaction(editingTransaction._id, data) : 
            handleAddTransaction
          }
          transaction={editingTransaction}
        />
      )}
    </div>
  );
};

export default BudgetPage;