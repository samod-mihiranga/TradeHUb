import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';

export default function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  // Raw material supplier form
  const [matForm, setMatForm] = useState({
    title: '',
    category: 'Rubber & Polymers',
    description: '',
    pricePerUnit: '',
    unit: 'kg',
    minOrderQuantity: 100,
    availableQuantity: 1000,
    location: user?.location || '',
    specifications: '',
    imageUrl: '',
  });

  // Product supplier form
  const [prodForm, setProdForm] = useState({
    title: '',
    category: 'Industrial Hardware',
    description: '',
    pricingType: 'fixed',
    fixedPrice: '',
    stockQuantity: 10,
    startingPrice: '',
    minBidIncrement: 25,
    auctionStartTime: new Date().toISOString().slice(0, 16),
    auctionEndTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: user?.location || '',
    imageUrl: '',
  });

  const loadDashboardData = async () => {
    try {
      if (user.role === 'raw_material_supplier') {
        const res = await api.get('/raw-materials/mine');
        setItems(res.data);
      } else if (user.role === 'product_supplier') {
        const [prodRes, ordRes] = await Promise.all([
          api.get('/products/mine'),
          api.get('/products/my-orders'),
        ]);
        setItems(prodRes.data);
        setOrders(ordRes.data);
      } else if (user.role === 'product_customer') {
        const [bidRes, ordRes] = await Promise.all([
          api.get('/products/my-bids'),
          api.get('/products/my-orders'),
        ]);
        setItems(bidRes.data);
        setOrders(ordRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    }
  };

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const handleImageUpload = async (file, target) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (target === 'material') {
        setMatForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
      } else {
        setProdForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/raw-materials', matForm);
      setSuccess('Raw material listing published!');
      setMatForm({
        ...matForm,
        title: '',
        description: '',
        pricePerUnit: '',
        specifications: '',
        imageUrl: '',
      });
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add raw material');
    }
  };

  const handleDeleteMaterial = async (id) => {
    await api.delete(`/raw-materials/${id}`);
    loadDashboardData();
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/products', prodForm);
      setSuccess('Finished product listing published!');
      setProdForm({
        ...prodForm,
        title: '',
        description: '',
        fixedPrice: '',
        startingPrice: '',
        imageUrl: '',
      });
      loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    loadDashboardData();
  };

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <div className="section-header" style={{ marginTop: 0 }}>
        <div>
          <h2>{ROLE_LABELS[user.role]} Dashboard</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
            Signed in as <strong>{user.name}</strong> ({user.companyName || user.email})
          </p>
        </div>
        <Link to="/inquiries" className="btn btn-outline">
          Open Inquiries Inbox
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* RAW MATERIAL SUPPLIER VIEW */}
      {user.role === 'raw_material_supplier' && (
        <>
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <h3>Add New Raw Material</h3>
            <form onSubmit={handleCreateMaterial}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    className="input"
                    value={matForm.title}
                    onChange={(e) => setMatForm({ ...matForm, title: e.target.value })}
                    placeholder="e.g., Grade-A Natural Rubber Sheets"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="select"
                    value={matForm.category}
                    onChange={(e) => setMatForm({ ...matForm, category: e.target.value })}
                  >
                    <option>Rubber &amp; Polymers</option>
                    <option>Metals &amp; Alloys</option>
                    <option>Textiles &amp; Fibers</option>
                    <option>Chemicals</option>
                    <option>Wood &amp; Paper</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price Per Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={matForm.pricePerUnit}
                    onChange={(e) => setMatForm({ ...matForm, pricePerUnit: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit (kg, ton, liter, meter)</label>
                  <input
                    className="input"
                    value={matForm.unit}
                    onChange={(e) => setMatForm({ ...matForm, unit: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Min Order Quantity</label>
                  <input
                    type="number"
                    className="input"
                    value={matForm.minOrderQuantity}
                    onChange={(e) => setMatForm({ ...matForm, minOrderQuantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Available Quantity</label>
                  <input
                    type="number"
                    className="input"
                    value={matForm.availableQuantity}
                    onChange={(e) => setMatForm({ ...matForm, availableQuantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    className="input"
                    value={matForm.location}
                    onChange={(e) => setMatForm({ ...matForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Specifications</label>
                  <input
                    className="input"
                    value={matForm.specifications}
                    onChange={(e) => setMatForm({ ...matForm, specifications: e.target.value })}
                    placeholder="Purity, grade, packaging..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Material Image (Optional — JPEG, PNG, WEBP up to 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => handleImageUpload(e.target.files?.[0], 'material')}
                />
                {uploading && <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>Uploading image...</span>}
                {matForm.imageUrl && (
                  <img src={matForm.imageUrl} alt="Preview" className="upload-preview" />
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={matForm.description}
                  onChange={(e) => setMatForm({ ...matForm, description: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                Publish Raw Material
              </button>
            </form>
          </div>

          <h3>My Raw Material Listings ({items.length})</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>MOQ / Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m._id}>
                    <td><strong>{m.title}</strong></td>
                    <td>{m.category}</td>
                    <td>${m.pricePerUnit} / {m.unit}</td>
                    <td>{m.minOrderQuantity} / {m.availableQuantity} {m.unit}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteMaterial(m._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* PRODUCT SUPPLIER VIEW */}
      {user.role === 'product_supplier' && (
        <>
          <div className="card" style={{ marginBottom: '1.75rem' }}>
            <h3>Add New Finished Product (Fixed Price or Auction)</h3>
            <form onSubmit={handleCreateProduct}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Product Title</label>
                  <input
                    className="input"
                    value={prodForm.title}
                    onChange={(e) => setProdForm({ ...prodForm, title: e.target.value })}
                    placeholder="e.g., Commercial Solar Inverter 10kW"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    className="input"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Pricing Method</label>
                  <select
                    className="select"
                    value={prodForm.pricingType}
                    onChange={(e) => setProdForm({ ...prodForm, pricingType: e.target.value })}
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="auction">Timed Auction</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    className="input"
                    value={prodForm.location}
                    onChange={(e) => setProdForm({ ...prodForm, location: e.target.value })}
                  />
                </div>

                {prodForm.pricingType === 'fixed' ? (
                  <>
                    <div className="form-group">
                      <label>Fixed Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={prodForm.fixedPrice}
                        onChange={(e) => setProdForm({ ...prodForm, fixedPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity</label>
                      <input
                        type="number"
                        min={1}
                        className="input"
                        value={prodForm.stockQuantity}
                        onChange={(e) => setProdForm({ ...prodForm, stockQuantity: e.target.value })}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Starting Bid Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input"
                        value={prodForm.startingPrice}
                        onChange={(e) => setProdForm({ ...prodForm, startingPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Minimum Bid Increment ($)</label>
                      <input
                        type="number"
                        min={1}
                        className="input"
                        value={prodForm.minBidIncrement}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, minBidIncrement: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Auction Start Time</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={prodForm.auctionStartTime}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, auctionStartTime: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Auction End Time</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={prodForm.auctionEndTime}
                        onChange={(e) =>
                          setProdForm({ ...prodForm, auctionEndTime: e.target.value })
                        }
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="form-group">
                <label>Product Image (Optional — JPEG, PNG, WEBP up to 5MB)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input"
                  onChange={(e) => handleImageUpload(e.target.files?.[0], 'product')}
                />
                {uploading && <span style={{ fontSize: '0.84rem', color: 'var(--muted)' }}>Uploading image...</span>}
                {prodForm.imageUrl && (
                  <img src={prodForm.imageUrl} alt="Preview" className="upload-preview" />
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={uploading}>
                Publish Product
              </button>
            </form>
          </div>

          <h3>My Finished Product Listings ({items.length})</h3>
          <div className="table-wrap" style={{ marginBottom: '2rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Method</th>
                  <th>Price / Current Bid</th>
                  <th>Auction Timer / Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <Link to={`/products/${p._id}`}><strong>{p.title}</strong></Link>
                    </td>
                    <td>
                      <span className={`badge ${p.pricingType === 'auction' ? 'badge-auction' : 'badge-fixed'}`}>
                        {p.pricingType}
                      </span>
                    </td>
                    <td>
                      {p.pricingType === 'auction'
                        ? `$${(p.currentBid || p.startingPrice).toLocaleString()} (${p.bids?.length || 0} bids)`
                        : `$${p.fixedPrice.toLocaleString()}`}
                    </td>
                    <td>
                      {p.pricingType === 'auction' ? (
                        <CountdownTimer startTime={p.auctionStartTime} endTime={p.auctionEndTime} />
                      ) : (
                        `${p.stockQuantity} in stock`
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProduct(p._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Incoming Orders ({orders.length})</h3>
          {orders.length === 0 ? (
            <div className="card">No orders received yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Buyer</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Shipping Address</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>{o.product?.title}</td>
                      <td>{o.buyer?.name} ({o.buyer?.email})</td>
                      <td>{o.quantity}</td>
                      <td><strong>${o.totalPrice.toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-fixed' : 'badge-auction'}`}>
                          {o.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td>{o.shippingAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* RAW MATERIAL CUSTOMER VIEW */}
      {user.role === 'raw_material_customer' && (
        <div className="card">
          <h3>Raw Material Sourcing Portal</h3>
          <p style={{ color: 'var(--muted)' }}>
            Browse raw materials listed by suppliers and start direct quote negotiations.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/raw-materials" className="btn btn-primary">
              Browse Raw Materials
            </Link>
            <Link to="/inquiries" className="btn btn-outline">
              View My Supplier Inquiries
            </Link>
          </div>
        </div>
      )}

      {/* PRODUCT CUSTOMER VIEW */}
      {user.role === 'product_customer' && (
        <>
          <h3>My Active &amp; Past Auction Bids ({items.length})</h3>
          {items.length === 0 ? (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              You haven&apos;t placed any bids yet.{' '}
              <Link to="/products">Explore live auctions →</Link>
            </div>
          ) : (
            <div className="table-wrap" style={{ marginBottom: '2rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current Highest Bid</th>
                    <th>Status</th>
                    <th>Time Remaining</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const isWinning = p.highestBidder?._id === user._id;
                    return (
                      <tr key={p._id}>
                        <td><strong>{p.title}</strong></td>
                        <td>${p.currentBid.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${isWinning ? 'badge-fixed' : 'badge-auction'}`}>
                            {isWinning ? 'Winning' : 'Outbid'}
                          </span>
                        </td>
                        <td>
                          <CountdownTimer startTime={p.auctionStartTime} endTime={p.auctionEndTime} />
                        </td>
                        <td>
                          <Link to={`/products/${p._id}`} className="btn btn-primary btn-sm">
                            Open Auction
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <h3>My Orders &amp; Payments ({orders.length})</h3>
          {orders.length === 0 ? (
            <div className="card">No orders placed yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>{o.product?.title}</td>
                      <td>{o.supplier?.companyName || o.supplier?.name}</td>
                      <td>{o.quantity}</td>
                      <td><strong>${o.totalPrice.toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${o.paymentStatus === 'paid' ? 'badge-fixed' : 'badge-auction'}`}>
                          {o.paymentStatus || 'pending'}
                        </span>
                      </td>
                      <td><span className="badge badge-fixed">{o.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
