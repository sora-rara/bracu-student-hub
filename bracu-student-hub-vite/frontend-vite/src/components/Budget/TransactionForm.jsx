// src/components/Budget/TransactionForm.jsx
import React, { useState, useEffect } from 'react';

function TransactionForm({ onClose, onSubmit, transaction }) {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: 'food_groceries',
    date: '',
    description: ''
  });

  useEffect(() => {
    // Get today's date in YYYY-MM-DD format (required by date input)
    const getTodayDate = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayFormatted = getTodayDate();
    
    console.log('Today formatted for form:', todayFormatted);
    
    if (transaction) {
      // Handle existing transaction date
      let transactionDate = todayFormatted;
      if (transaction.date) {
        try {
          // Parse the date string
          let dateObj;
          if (typeof transaction.date === 'string') {
            // If it's already in YYYY-MM-DD format
            if (transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              transactionDate = transaction.date;
            } else {
              // Try to parse as Date object
              dateObj = new Date(transaction.date);
              if (!isNaN(dateObj.getTime())) {
                // Convert to YYYY-MM-DD format for the input
                const tYear = dateObj.getFullYear();
                const tMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
                const tDay = String(dateObj.getDate()).padStart(2, '0');
                transactionDate = `${tYear}-${tMonth}-${tDay}`;
              }
            }
          } else if (transaction.date instanceof Date) {
            dateObj = transaction.date;
            const tYear = dateObj.getFullYear();
            const tMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
            const tDay = String(dateObj.getDate()).padStart(2, '0');
            transactionDate = `${tYear}-${tMonth}-${tDay}`;
          }
        } catch (error) {
          console.error('Error parsing transaction date:', error);
          transactionDate = todayFormatted;
        }
      }
      
      setFormData({
        amount: transaction.amount ? transaction.amount.toString() : '',
        type: transaction.type || 'expense',
        category: transaction.category || 'food_groceries',
        date: transactionDate,
        description: transaction.description || ''
      });
    } else {
      // Set default to today's date
      console.log('Setting default date to:', todayFormatted);
      setFormData({
        amount: '',
        type: 'expense',
        category: 'food_groceries',
        date: todayFormatted,
        description: ''
      });
    }
  }, [transaction]);

  const categories = {
    expense: [
      'tuition_fees', 'books_supplies', 'rent', 'utilities', 'food_groceries', 
      'transportation', 'entertainment', 'shopping', 'healthcare', 'subscriptions', 
      'dining_out', 'other_expense'
    ],
    income: [
      'salary', 'allowance', 'scholarship', 'freelance', 'investment', 'gift', 'other_income'
    ]
  };

  const categoryLabels = {
    // Expense categories
    'tuition_fees': 'Tuition Fees',
    'books_supplies': 'Books & Supplies',
    'rent': 'Rent',
    'utilities': 'Utilities',
    'food_groceries': 'Food & Groceries',
    'transportation': 'Transportation',
    'entertainment': 'Entertainment',
    'shopping': 'Shopping',
    'healthcare': 'Healthcare',
    'subscriptions': 'Subscriptions',
    'dining_out': 'Dining Out',
    'other_expense': 'Other Expense',
    
    // Income categories
    'salary': 'Salary',
    'allowance': 'Allowance',
    'scholarship': 'Scholarship',
    'freelance': 'Freelance',
    'investment': 'Investment',
    'gift': 'Gift',
    'other_income': 'Other Income'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate amount - FIXED: Allow any positive number
    const amountValue = parseFloat(formData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    
    // Validate date
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    // Format the data for backend - FIXED: Use any valid number format
    const formattedData = {
      ...formData,
      amount: amountValue, // Just parse the float value
      // Send date as YYYY-MM-DD string
      date: formData.date
    };
    
    console.log('Submitting transaction data:', formattedData);
    onSubmit(formattedData);
  };

  // Get today's date for max attribute (allow today and past dates only)
  const getMaxDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date for display
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Amount (৳) *</label>
                <div className="price-input-group">
                  <span className="currency-symbol">৳</span>
                  <input
                    type="number" // CHANGED: Use number input but without step restriction
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="0.00"
                    step="any" // CHANGED: Allow any step value (both whole and fractional numbers)
                    min="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  {categories[formData.type].map(cat => (
                    <option key={cat} value={cat}>
                      {categoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="form-control"
                  required
                  max={getMaxDate()} // Allow today and past dates
                />
                <small className="text-muted">
                  Selected: {formatDateForDisplay(formData.date) || 'No date selected'}
                </small>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                placeholder="Add any additional details (optional)..."
                rows="3"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {transaction ? 'Update Transaction' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;