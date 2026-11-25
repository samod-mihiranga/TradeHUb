import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        if (sessionId) {
          const res = await api.get(`/payments/verify-session/${sessionId}`);
          setOrder(res.data.order);
        } else if (orderId) {
          const res = await api.get(`/payments/order/${orderId}`);
          setOrder(res.data.order);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load order receipt');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [sessionId, orderId]);

  if (loading) return <div className="container page-loading">Verifying payment...</div>;

  return (
    <div className="container" style={{ paddingTop: '2rem', maxWidth: '640px' }}>
      <div className="card">
        <span className="badge badge-fixed" style={{ alignSelf: 'flex-start' }}>
          Payment Confirmed
        </span>
        <h2 style={{ margin: '0.25rem 0' }}>Thank you! Your order is confirmed.</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {order && (
          <div style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
            <p>
              <strong>Product:</strong> {order.product?.title}
            </p>
            <p>
              <strong>Quantity:</strong> {order.quantity}
            </p>
            <p>
              <strong>Amount Paid:</strong> ${Number(order.totalPrice).toLocaleString()}
            </p>
            <p>
              <strong>Payment Method:</strong> {order.paymentMethod === 'stripe' ? 'Stripe' : 'Test Card Gateway'}
            </p>
            <p>
              <strong>Shipping Address:</strong> {order.shippingAddress}
            </p>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-primary">
            View My Orders
          </Link>
          <Link to="/products" className="btn btn-outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
