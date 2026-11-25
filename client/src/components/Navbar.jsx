import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand">
          Trade<span>Hub</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/raw-materials">Raw Materials</NavLink>
          <NavLink to="/products">Products &amp; Auctions</NavLink>
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && <NavLink to="/inquiries">Inquiries</NavLink>}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span className="role-pill">{ROLE_LABELS[user.role] || user.role}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name}</span>
              <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
