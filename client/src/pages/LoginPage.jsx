import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Raw Material Supplier', email: 'rawsupplier@tradehub.demo' },
  { label: 'Product Supplier', email: 'productsupplier@tradehub.demo' },
  { label: 'Raw Material Customer', email: 'rawcustomer@tradehub.demo' },
  { label: 'Product Customer', email: 'productcustomer@tradehub.demo' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="container">
      <div className="card auth-card">
        <h2 style={{ marginTop: 0 }}>Log In to TradeHub</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--muted)' }}>
            Quick Fill Demo Accounts (after running seed script):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => fillDemo(acc.email)}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
          Need an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
