// src/components/ProtectedRoute.jsx (UPDATED)
import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // <--- ADD THIS IMPORT

const ProtectedRoute = ({ children }) => {
  // Check if a token exists in cookies
  const token = Cookies.get('token');

  if (token === undefined) {
    // If no token is found, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If a token is found, render the child components (the protected content)
  return children;
};

export default ProtectedRoute;
