// src/api/budget.jsx
import axios from './axios';

const budgetApi = {
  // Transactions with optional limit parameter
  getTransactions: (params = {}) => {
    const defaultParams = { limit: 100 };
    return axios.get('/budget/transactions', { 
      params: { ...defaultParams, ...params } 
    });
  },
  getTransaction: (id) => axios.get(`/budget/transactions/${id}`),
  createTransaction: (data) => {
    console.log('📤 Creating transaction with data:', data);
    return axios.post('/budget/transactions', data);
  },
  updateTransaction: (id, data) => {
    console.log('📤 Updating transaction:', id, data);
    return axios.put(`/budget/transactions/${id}`, data); // FIXED: Ensure this uses PUT
  },
  deleteTransaction: (id) => {
    console.log('🗑️ Deleting transaction:', id);
    return axios.delete(`/budget/transactions/${id}`); // FIXED: Ensure this uses DELETE
  },

  // Summary & Analytics
  getSummary: (params) => axios.get('/budget/summary', { params }),
  getMonthlyBreakdown: (months = 6) => axios.get('/budget/monthly-breakdown', { params: { months } }),
  getCategoryBreakdown: (startDate, endDate) => axios.get('/budget/category-breakdown', {
    params: { startDate, endDate }
  }),
  getInsights: () => axios.get('/budget/insights'),
  
  // Goals
  getGoals: () => axios.get('/budget/goals'),
  setGoals: (data) => {
    console.log('📤 Setting budget goals:', data);
    return axios.post('/budget/goals', data);
  },

  // Health check
  health: () => axios.get('/budget/health'),
  
  // Test
  test: () => axios.get('/budget/test'),

  // Backward compatibility
  getBudget: () => axios.get('/budget/summary'),
  addTransaction: (data) => {
    console.log('📤 Adding transaction (compat):', data);
    return axios.post('/budget/transactions', data);
  },
  setBudget: (data) => {
    console.log('📤 Setting budget (compat):', data);
    return axios.post('/budget/goals', data);
  }
};

export default budgetApi;