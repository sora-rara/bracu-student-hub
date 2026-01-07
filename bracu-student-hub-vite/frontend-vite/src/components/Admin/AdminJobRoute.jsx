// src/components/admin/AdminJobRoute.jsx
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/auth.jsx';

const AdminJobRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const result = await authService.checkAuthStatus();
        if (result.loggedIn) {
          const user = authService.getCurrentUser();
          setAuthenticated(true);
          setIsUserAdmin(user?.role === "admin" || user?.isAdmin);
        } else {
          setAuthenticated(false);
        }
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  if (loading) return <div className="loading">Verifying admin access...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  if (!isUserAdmin) return <Navigate to="/dashboard" replace />;
  
  return children;
};

export default AdminJobRoute;