import React, { useState } from 'react';
import api from '../api/axios';

export default function ContactSupplierModal({ itemType, item, onClose, onSuccess }) {
  const [subject, setSubject] = useState(`Inquiry about ${item.title}`);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/inquiries', {
        itemType,
        itemId: item._id,
        subject,
        message,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Contact Supplier</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 0 }}>
          Sending message to{' '}
          <strong>{item.supplier?.companyName || item.supplier?.name || 'Supplier'}</strong> regarding{' '}
          <strong>{item.title}</strong>.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="inquiry-subject">Subject</label>
            <input
              id="inquiry-subject"
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="inquiry-message">Message</label>
            <textarea
              id="inquiry-message"
              className="textarea"
              rows={4}
              placeholder="Ask about pricing, minimum order quantity, shipping, or product specifications..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
