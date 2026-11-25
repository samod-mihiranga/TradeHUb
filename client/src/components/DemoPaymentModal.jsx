import React, { useState } from 'react';
import api from '../api/axios';

export default function DemoPaymentModal({ checkoutData, onClose, onPaid }) {
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('424');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setProcessing(true);
    try {
      const digits = cardNumber.replace(/\D/g, '');
      const cardLast4 = digits.slice(-4) || '4242';
      const res = await api.post(`/payments/demo-pay/${checkoutData.orderId}`, {
        cardHolder,
        cardLast4,
      });
      onPaid(res.data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Secure Checkout (Test Gateway)</h3>
          <span className="badge badge-auction">Demo Mode</span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
          Paying for <strong>{checkoutData.productTitle}</strong> — Total:{' '}
          <strong>${Number(checkoutData.totalPrice).toLocaleString()}</strong>.
          <br />
          <span>Add a <code>STRIPE_SECRET_KEY</code> in <code>server/.env</code> to use live Stripe Checkout.</span>
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handlePay}>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              className="input"
              placeholder="e.g., Dilshan Jayawardena"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Test Card Number</label>
            <input
              className="input"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Expiry (MM/YY)</label>
              <input
                className="input"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>CVC</label>
              <input
                className="input"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={processing}>
              {processing ? 'Processing...' : `Pay $${Number(checkoutData.totalPrice).toLocaleString()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
