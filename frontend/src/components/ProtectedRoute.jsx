// src/components/ProtectedRoute.jsx (UPDATED)
import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // <--- ADD THIS IMPORT
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
  // Check if a token exists in cookies
  const token = Cookies.get('token');

  if (token === undefined) {
    // If no token is found, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // seconds

    if (decoded.exp < now) {
      // Token expired
      Cookies.remove('token');
      alert('Your session has expired. Please log in again.');
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    Cookies.remove('token');
    return <Navigate to="/login" replace />;
  }

  // If a token is found, render the child components (the protected content)
  return children;
};

export default ProtectedRoute;
