// src/components/Budget/BudgetSummary.jsx
import React, { useState, useEffect } from 'react';
import budgetApi from '../../api/budget';

function BudgetSummary({ onSetBudget }) {
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [budgetData, setBudgetData] = useState({
    monthlyBudget: 0,
    monthlyIncome: 0,
    savingsGoal: 0,
    currentBalance: 0,
    totalIncome: 0, // Keep this for reference but don't display
    totalExpenses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const [goalsResponse, summaryResponse] = await Promise.all([
        budgetApi.getGoals(),
        budgetApi.getSummary()
      ]);

      console.log('Goals Response:', goalsResponse.data);
      console.log('Summary Response:', summaryResponse.data);

      // Initialize with defaults
      const newBudgetData = {
        monthlyBudget: 0,
        monthlyIncome: 0,
        savingsGoal: 0,
        currentBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
      };

      // Handle goals response
      if (goalsResponse.data && goalsResponse.data.success) {
        const goals = goalsResponse.data.data || goalsResponse.data;
        newBudgetData.monthlyBudget = goals.monthlyBudget || 0;
        newBudgetData.monthlyIncome = goals.monthlyIncome || 0;
        newBudgetData.savingsGoal = goals.savingsGoal || 0;

        setBudgetAmount(goals.monthlyBudget || 0);
        setMonthlyIncome(goals.monthlyIncome || 0);
        setSavingsGoal(goals.savingsGoal || 0);
      }

      // Handle summary response
      if (summaryResponse.data && summaryResponse.data.success) {
        const data = summaryResponse.data.data || summaryResponse.data;
        const summary = data.summary || data;
        const totals = data.totals || {};

        newBudgetData.totalIncome = totals.totalIncome || summary.totalIncome || 0;
        newBudgetData.totalExpenses = totals.totalExpense || summary.totalExpenses || summary.totalExpense || 0;

        // FIX: Calculate current balance as: Monthly Income - Total Expenses
        // Use monthlyIncome from goals if available, otherwise use totalIncome
        const incomeForBalance = newBudgetData.monthlyIncome > 0 ?
          newBudgetData.monthlyIncome :
          newBudgetData.totalIncome;
        newBudgetData.currentBalance = incomeForBalance - newBudgetData.totalExpenses;
      } else {
        // If no summary data, calculate based on goals
        const incomeForBalance = newBudgetData.monthlyIncome > 0 ?
          newBudgetData.monthlyIncome :
          newBudgetData.totalIncome;
        newBudgetData.currentBalance = incomeForBalance - newBudgetData.totalExpenses;
      }

      setBudgetData(newBudgetData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      // Set default values on error
      setBudgetData({
        monthlyBudget: 0,
        monthlyIncome: 0,
        savingsGoal: 0,
        currentBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    try {
      if (onSetBudget) {
        await onSetBudget({
          monthlyBudget: parseFloat(budgetAmount) || 0,
          monthlyIncome: parseFloat(monthlyIncome) || 0,
          savingsGoal: parseFloat(savingsGoal) || 0
        });
        await fetchBudgetData(); // Refresh data
      }
      setShowBudgetForm(false);
    } catch (error) {
      console.error('Error setting budget:', error);
      alert('Failed to set budget. Please try again.');
    }
  };

  const getBudgetStatus = () => {
    if (!budgetData.monthlyBudget || budgetData.monthlyBudget === 0) return 'info';
    const budgetPercentage = (budgetData.totalExpenses / budgetData.monthlyBudget) * 100;
    if (budgetPercentage < 70) return 'success';
    if (budgetPercentage < 90) return 'warning';
    return 'danger';
  };

  const formatAmount = (amount) => {
    return `৳${parseFloat(amount || 0).toFixed(2)}`;
  };

  // FIXED CALCULATIONS:
  const remainingBudget = budgetData.monthlyBudget - budgetData.totalExpenses;
  const budgetPercentage = budgetData.monthlyBudget ?
    (budgetData.totalExpenses / budgetData.monthlyBudget) * 100 : 0;

  // Recalculate current balance based on monthly income
  const currentBalance = budgetData.monthlyIncome - budgetData.totalExpenses;

  // Calculate savings progress (only positive balance contributes to savings)
  const savingsProgress = budgetData.savingsGoal > 0 ?
    Math.min(Math.round((Math.max(currentBalance, 0) / budgetData.savingsGoal) * 100), 100) : 0;

  if (loading) {
    return (
      <div className="card budget-summary-card">
        <div className="card-header">
          <h3 className="card-title">Budget Summary</h3>
        </div>
        <div className="budget-stats">
          <div className="loading-spinner"></div>
          <p>Loading budget data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card budget-summary-card">
      <div className="card-header">
        <h3 className="card-title">Budget Summary</h3>
        <button
          onClick={() => setShowBudgetForm(!showBudgetForm)}
          className="btn btn-sm btn-primary"
        >
          {budgetData.monthlyBudget > 0 ? 'Adjust Budget' : 'Set Budget'}
        </button>
      </div>

      {showBudgetForm && (
        <div className="budget-form-section active">
          <div className="form-header">
            <h4>{budgetData.monthlyBudget > 0 ? 'Adjust Budget Goals' : 'Set Budget Goals'}</h4>
            <button
              type="button"
              className="btn-close-form"
              onClick={() => setShowBudgetForm(false)}
              aria-label="Close form"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSetBudget}>
            <div className="form-row">
              <div className="form-group">
                <label>Monthly Income (৳) *</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="form-control"
                  placeholder="Enter expected monthly income"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Budget (৳)</label>
                <input
                  type="number"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="form-control"
                  placeholder="Enter monthly budget"
                  step="0.01"
                  min="0"
                />
                <small className="text-muted">Recommended: Less than monthly income</small>
              </div>
            </div>

            <div className="form-group">
              <label>Savings Goal (৳)</label>
              <input
                type="number"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                className="form-control"
                placeholder="Enter savings goal"
                step="0.01"
                min="0"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBudgetForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Budget
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="budget-stats">
        <div className="budget-summary-grid">
          <div className="budget-summary-item">
            <div className="budget-summary-label">Monthly Income</div>
            <div className="budget-summary-value text-success">
              {formatAmount(budgetData.monthlyIncome)}
            </div>
          </div>

          <div className="budget-summary-item">
            <div className="budget-summary-label">Total Expenses</div>
            <div className="budget-summary-value text-danger">
              {formatAmount(budgetData.totalExpenses)}
            </div>
          </div>

          <div className="budget-summary-item">
            <div className="budget-summary-label">Monthly Budget</div>
            <div className="budget-summary-value">
              {budgetData.monthlyBudget > 0 ? formatAmount(budgetData.monthlyBudget) : 'Not Set'}
            </div>
          </div>

          <div className="budget-summary-item">
            <div className="budget-summary-label">Savings Goal</div>
            <div className="budget-summary-value text-info">
              {formatAmount(budgetData.savingsGoal)}
            </div>
          </div>

          <div className="budget-summary-item">
            <div className="budget-summary-label">Current Balance</div>
            <div className={`budget-summary-value ${currentBalance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatAmount(currentBalance)}
            </div>
          </div>

          <div className="budget-summary-item">
            <div className="budget-summary-label">Savings Progress</div>
            <div className="budget-summary-value">
              {budgetData.savingsGoal > 0 ? `${savingsProgress}%` : '0%'}
            </div>
          </div>
        </div>

        {budgetData.monthlyBudget > 0 && (
          <div className="budget-progress-container">
            <div className="budget-progress-label">
              <span>Budget Usage</span>
              <span>{budgetPercentage.toFixed(1)}%</span>
            </div>
            <div className="budget-progress-bar">
              <div
                className={`budget-progress-fill ${getBudgetStatus()}`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="budget-tips">
          <h4>Budgeting Tips:</h4>
          <ul>
            <li>Track every expense, no matter how small</li>
            <li>Set monthly budget less than your monthly income</li>
            <li>Review your spending weekly</li>
            <li>Save at least 20% of your income</li>
            <li>Aim for positive current balance (Income &gt; Expenses)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BudgetSummary;