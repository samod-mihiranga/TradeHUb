import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function InquiriesPage() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [replyTexts, setReplyTexts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inquiries');
      setInquiries(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleReply = async (e, inquiryId) => {
    e.preventDefault();
    const text = (replyTexts[inquiryId] || '').trim();
    if (!text) return;
    try {
      const res = await api.post(`/inquiries/${inquiryId}/reply`, { text });
      setInquiries((prev) => prev.map((inq) => (inq._id === inquiryId ? res.data : inq)));
      setReplyTexts((prev) => ({ ...prev, [inquiryId]: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply');
    }
  };

  const isSupplier =
    user?.role === 'raw_material_supplier' || user?.role === 'product_supplier';

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="section-header" style={{ marginTop: 0 }}>
        <div>
          <h2>{isSupplier ? 'Customer Inquiries Inbox' : 'My Supplier Inquiries'}</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
            Direct messaging threads between customers and suppliers.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-loading">Loading conversations...</div>
      ) : inquiries.length === 0 ? (
        <div className="card">No inquiries yet.</div>
      ) : (
        <div className="grid">
          {inquiries.map((inq) => {
            const itemTitle =
              inq.itemType === 'raw_material'
                ? inq.rawMaterial?.title || 'Raw Material'
                : inq.product?.title || 'Finished Product';

            return (
              <div className="card" key={inq._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span className={`badge ${inq.itemType === 'raw_material' ? 'badge-fixed' : 'badge-auction'}`}>
                      {inq.itemType === 'raw_material' ? 'Raw Material' : 'Finished Product'}
                    </span>{' '}
                    <strong>{inq.subject}</strong>
                  </div>
                  <span className="badge badge-closed">{inq.status}</span>
                </div>

                <div className="card-meta">
                  <span>Item: <strong>{itemTitle}</strong></span>
                  <span>
                    {isSupplier
                      ? `Customer: ${inq.customer?.name} (${inq.customer?.companyName || inq.customer?.email})`
                      : `Supplier: ${inq.supplier?.companyName || inq.supplier?.name} (${inq.supplier?.email})`}
                  </span>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  {inq.messages.map((m) => {
                    const mine = m.sender?._id === user._id;
                    return (
                      <div key={m._id} className={`message-bubble ${mine ? 'mine' : ''}`}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>
                          <strong>{m.sender?.name || 'User'}</strong> •{' '}
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                        <div>{m.text}</div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => handleReply(e, inq._id)}
                  style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}
                >
                  <input
                    className="input"
                    placeholder="Write a reply..."
                    value={replyTexts[inq._id] || ''}
                    onChange={(e) =>
                      setReplyTexts((prev) => ({ ...prev, [inq._id]: e.target.value }))
                    }
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Send
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
