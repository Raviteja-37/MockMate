// src/components/Navbar/index.jsx (UPDATED for conditional rendering)
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // <--- ADD useLocation
import Cookies from 'js-cookie';
import './index.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // <--- Get current location

  const handleLogout = () => {
    Cookies.remove('token'); // Remove the JWT token from cookies
    navigate('/login', { replace: true }); // Redirect to login page
  };

  // Determine if the user is logged in
  const isLoggedIn = Cookies.get('token') !== undefined;

  // Determine if current page is Login or Register
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';

  return (
    <nav className="navbar-container">
      <div className="navbar-logo">
        {/* Logo always links to dashboard if logged in, otherwise to login */}
        <Link to={isLoggedIn ? '/dashboard' : '/login'}>
          <img className="nav-logo-img" src="/NavMock.png" width="150" />
        </Link>
      </div>
      <ul className="navbar-links">
        {/* Show Dashboard link only if logged in */}
        {isLoggedIn && (
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
        )}

        {/* Show Login/Register links only if not logged in AND on an auth page */}
        {!isLoggedIn && isAuthPage && (
          <>
            {location.pathname !== '/login' && (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
            {location.pathname !== '/register' && (
              <li>
                <Link to="/register">Register</Link>
              </li>
            )}
          </>
        )}

        {/* Show Logout if logged in */}
        {isLoggedIn && (
          <li>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
