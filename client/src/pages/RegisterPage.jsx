import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'product_customer',
    companyName: '',
    phone: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="card auth-card">
        <h2 style={{ marginTop: 0 }}>Create TradeHub Account</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Account Role</label>
            <select
              className="select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="raw_material_supplier">Raw Material Supplier (Add raw materials)</option>
              <option value="product_supplier">Product Supplier (Add fixed-price or auction products)</option>
              <option value="raw_material_customer">Raw Material Customer (Contact raw material suppliers)</option>
              <option value="product_customer">Product Customer (Buy, bid on auctions &amp; contact suppliers)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Password (min 6 characters)</label>
            <input
              type="password"
              minLength={6}
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Company Name (Optional)</label>
            <input
              className="input"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Phone</label>
              <input
                className="input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
