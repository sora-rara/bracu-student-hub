import React, { useState } from 'react';

function TransactionList({ transactions, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fix: Add safety check for transactions
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  const filteredTransactions = safeTransactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'expense') return transaction.type === 'expense';
    if (filter === 'income') return transaction.type === 'income';
    return transaction.category === filter;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'title':
        // Use description instead of title since backend doesn't have title field
        aValue = (a.description || '').toLowerCase();
        bValue = (b.description || '').toLowerCase();
        break;
      default:
        aValue = a.date;
        bValue = b.date;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Updated icons to match backend categories
  const getCategoryIcon = (category) => {
    const icons = {
      // Income categories
      'salary': ' ',
      'allowance': ' ',
      'scholarship': '',
      'freelance': '',
      'investment': '',
      'gift': '',
      'other_income': '',
      
      // Expense categories
      'tuition_fees': '',
      'books_supplies': '',
      'rent': '',
      'utilities': '',
      'food_groceries': '',
      'transportation': '',
      'entertainment': '',
      'shopping': '',
      'healthcare': '',
      'subscriptions': '',
      'dining_out': '',
      'other_expense': ''
    };
    return icons[category] || '';
  };

  const getTypeColor = (type) => {
    return type === 'income' ? 'text-success' : 'text-danger';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `৳${parseFloat(amount).toFixed(2)}`;
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    return category
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="card transaction-list-card">
      <div className="card-header">
        <h3 className="card-title">Transactions</h3>
        <div className="list-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="form-control form-control-sm"
          >
            <option value="all">All Transactions</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
            
            {/* Expense categories */}
            <option value="tuition_fees">Tuition Fees</option>
            <option value="books_supplies">Books & Supplies</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="food_groceries">Food & Groceries</option>
            <option value="transportation">Transportation</option>
            <option value="entertainment">Entertainment</option>
            <option value="shopping">Shopping</option>
            <option value="healthcare">Healthcare</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="dining_out">Dining Out</option>
            <option value="other_expense">Other Expenses</option>
            
            {/* Income categories */}
            <option value="salary">Salary</option>
            <option value="allowance">Allowance</option>
            <option value="scholarship">Scholarship</option>
            <option value="freelance">Freelance</option>
            <option value="investment">Investment</option>
            <option value="gift">Gift</option>
            <option value="other_income">Other Income</option>
          </select>
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="form-control form-control-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="title">Sort by Description</option>
          </select>
          
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-sm btn-outline"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>
      </div>

      <div className="transaction-list-container">
        {sortedTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="transaction-items">
            {sortedTransactions.map(transaction => (
              <div key={transaction._id || transaction.id || Math.random()} className="transaction-item">
                <div className="transaction-icon">
                  <span>{getCategoryIcon(transaction.category)}</span>
                </div>
                
                <div className="transaction-details">
                  <div className="transaction-title">
                    <strong>{transaction.description || 'No Description'}</strong>
                    <span className={`transaction-amount ${getTypeColor(transaction.type)}`}>
                      {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
                    </span>
                  </div>
                  
                  <div className="transaction-meta">
                    <span className="transaction-category">
                      {formatCategoryName(transaction.category)}
                    </span>
                    <span className="transaction-date">
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                  
                  {transaction.tags && transaction.tags.length > 0 && (
                    <div className="transaction-tags">
                      {transaction.tags.map((tag, index) => (
                        <span key={index} className="badge badge-secondary mr-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="transaction-actions">
                  <button 
                    onClick={() => onEdit && onEdit(transaction)}
                    className="btn btn-sm btn-outline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete && onDelete(transaction._id || transaction.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionList;