// src/services/careerService.js - FIXED FOR VITE/REACT
import axios from '../api/axios';

// For Vite/React, use import.meta.env instead of process.env
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const careerAPI = {
  // Public/Student endpoints
  getAllInternships: (params = {}) => {
    return axios.get(`${API_BASE}/api/career/internships`, { params });
  },
  
  getInternshipById: (id) => {
    return axios.get(`${API_BASE}/api/career/internships/${id}`);
  },
  
  getSimilarInternships: (category, excludeId) => {
    return axios.get(`${API_BASE}/api/career/internships/similar`, {
      params: { category, excludeId, limit: 3 }
    });
  },
  
  // Saved internships (requires authentication)
  getSavedInternships: () => {
    return axios.get(`${API_BASE}/api/career/student/saved`, {
      withCredentials: true
    });
  },
  
  saveInternship: (internshipId) => {
    return axios.post(`${API_BASE}/api/career/student/saved/${internshipId}`, {}, {
      withCredentials: true
    });
  },
  
  removeSavedInternship: (internshipId) => {
    return axios.delete(`${API_BASE}/api/career/student/saved/${internshipId}`, {
      withCredentials: true
    });
  },
  
  checkIfSaved: (internshipId) => {
    return axios.get(`${API_BASE}/api/career/student/saved/${internshipId}/check`, {
      withCredentials: true
    });
  },
  
  // Application tracking
  trackApplication: (internshipId) => {
    return axios.post(`${API_BASE}/api/career/internships/${internshipId}/track-application`, {}, {
      withCredentials: true
    });
  },
  
  // Search
  searchInternships: (filters) => {
    return axios.get(`${API_BASE}/api/career/internships/search`, {
      params: filters
    });
  },
  
  // Statistics
  getStats: () => {
    return axios.get(`${API_BASE}/api/career/stats`);
  },
  
  // Admin endpoints
  createInternship: (data) => {
    return axios.post(`${API_BASE}/api/career/admin/internships`, data, {
      withCredentials: true
    });
  },
  
  updateInternship: (id, data) => {
    return axios.put(`${API_BASE}/api/career/admin/internships/${id}`, data, {
      withCredentials: true
    });
  },
  
  deleteInternship: (id) => {
    return axios.delete(`${API_BASE}/api/career/admin/internships/${id}`, {
      withCredentials: true
    });
  },
  
  getInternshipStats: () => {
    return axios.get(`${API_BASE}/api/career/admin/stats`, {
      withCredentials: true
    });
  }
};