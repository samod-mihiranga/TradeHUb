import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';
import ContactSupplierModal from '../components/ContactSupplierModal';
import DemoPaymentModal from '../components/DemoPaymentModal';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [liveNotice, setLiveNotice] = useState('');

  // Bidding state
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);

  // Checkout state (fixed-price or won auction)
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [demoCheckout, setDemoCheckout] = useState(null);

  // Contact modal
  const [showContact, setShowContact] = useState(false);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
      if (res.data.pricingType === 'auction') {
        const minNext =
          res.data.currentBid > 0
            ? res.data.currentBid + (res.data.minBidIncrement || 1)
            : res.data.startingPrice;
        setBidAmount(String(minNext));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [id]);

  // Subscribe to real-time WebSocket bid updates for this product
  useEffect(() => {
    if (!id) return undefined;
    socket.emit('join_product', id);

    const handleLiveBid = (updatedProduct) => {
      setProduct(updatedProduct);
      const nextMin = updatedProduct.currentBid + (updatedProduct.minBidIncrement || 1);
      setBidAmount(String(nextMin));
      setLiveNotice(
        `Live update: New highest bid $${updatedProduct.currentBid.toLocaleString()} by ${
          updatedProduct.highestBidder?.name || 'a bidder'
        }`
      );
    };

    socket.on('bid_updated', handleLiveBid);

    return () => {
      socket.emit('leave_product', id);
      socket.off('bid_updated', handleLiveBid);
    };
  }, [id]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBidding(true);
    try {
      const res = await api.post(`/products/${id}/bid`, { amount: Number(bidAmount) });
      setProduct(res.data);
      const nextMin = res.data.currentBid + (res.data.minBidIncrement || 1);
      setBidAmount(String(nextMin));
      setSuccess(`Bid of $${Number(bidAmount).toLocaleString()} placed successfully!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const handleStartCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCheckingOut(true);
    try {
      const res = await api.post('/payments/checkout', {
        productId: id,
        quantity: product.pricingType === 'fixed' ? Number(quantity) : 1,
        shippingAddress,
      });

      if (res.data.mode === 'stripe' && res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
        return;
      }

      // Open built-in Test Card Payment Gateway modal
      setDemoCheckout(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) return <div className="container page-loading">Loading product details...</div>;
  if (!product) {
    return (
      <div className="container" style={{ paddingTop: '2rem' }}>
        <div className="alert alert-error">{error || 'Product not found'}</div>
        <Link to="/products" className="btn btn-outline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  const now = Date.now();
  const isAuctionEnded =
    product.pricingType === 'auction' &&
    product.auctionEndTime &&
    now > new Date(product.auctionEndTime).getTime();

  const isAuctionWinner =
    user &&
    product.pricingType === 'auction' &&
    isAuctionEnded &&
    product.highestBidder?._id === user._id &&
    product.status !== 'sold';

  const minNextBid =
    product.pricingType === 'auction'
      ? product.currentBid > 0
        ? product.currentBid + (product.minBidIncrement || 1)
        : product.startingPrice
      : 0;

  return (
    <div className="container" style={{ paddingTop: '1.5rem' }}>
      <Link to="/products" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Back to Products &amp; Auctions
      </Link>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {liveNotice && <div className="alert alert-success">{liveNotice}</div>}

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        {/* Product info */}
        <div className="card">
          <img
            src={product.imageUrl || '/images/finished-products.svg'}
            alt={product.title}
            className="item-image-lg"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              className={`badge ${
                product.pricingType === 'auction' ? 'badge-auction' : 'badge-fixed'
              }`}
            >
              {product.pricingType === 'auction' ? 'Timed Auction' : 'Fixed Price'}
            </span>
            <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{product.category}</span>
          </div>

          <h2 style={{ margin: '0.25rem 0' }}>{product.title}</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>{product.description}</p>

          <div className="card-meta" style={{ marginTop: '0.5rem' }}>
            <span>Location: <strong>{product.location || 'Not specified'}</strong></span>
            <span>Status: <strong>{product.status}</strong></span>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.9rem',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Product Supplier</div>
            <div style={{ fontWeight: 700 }}>
              {product.supplier?.companyName || product.supplier?.name}
            </div>
            <div style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>
              {product.supplier?.email} {product.supplier?.phone ? `• ${product.supplier.phone}` : ''}
            </div>
          </div>

          <div className="card-actions">
            {user?.role === 'product_customer' ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowContact(true)}
              >
                Contact Product Supplier
              </button>
            ) : !user ? (
              <Link to="/login" className="btn btn-outline">
                Log in as Product Customer to Contact or Bid
              </Link>
            ) : null}
          </div>
        </div>

        {/* Action panel: Real-Time Auction Bidding or Fixed-Price Checkout */}
        <div className="card">
          {product.pricingType === 'auction' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Live Auction</h3>
                  <span className="live-pill">
                    <span className="live-dot" /> Real-Time
                  </span>
                </div>
                <CountdownTimer
                  startTime={product.auctionStartTime}
                  endTime={product.auctionEndTime}
                />
              </div>

              <div className="price-tag" style={{ marginTop: '0.4rem' }}>
                ${(product.currentBid || product.startingPrice).toLocaleString()}
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--muted)' }}>
                  {' '}
                  {product.currentBid > 0 ? 'Current Highest Bid' : 'Starting Price'}
                </span>
              </div>

              <div className="card-meta">
                <span>Min Increment: <strong>${product.minBidIncrement}</strong></span>
                <span>Total Bids: <strong>{product.bids?.length || 0}</strong></span>
                {product.highestBidder && (
                  <span>Leading Bidder: <strong>{product.highestBidder.name}</strong></span>
                )}
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                Auction Window: {new Date(product.auctionStartTime).toLocaleString()} —{' '}
                {new Date(product.auctionEndTime).toLocaleString()}
              </div>

              {user?.role === 'product_customer' && !isAuctionEnded && product.status === 'active' ? (
                <form onSubmit={handlePlaceBid} style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="bid-amount">
                      Your Bid Amount (Minimum ${minNextBid.toLocaleString()})
                    </label>
                    <input
                      id="bid-amount"
                      type="number"
                      step="0.01"
                      min={minNextBid}
                      className="input"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-accent" disabled={bidding}>
                    {bidding ? 'Submitting Bid...' : 'Place Live Bid'}
                  </button>
                </form>
              ) : isAuctionWinner ? (
                <form onSubmit={handleStartCheckout} style={{ marginTop: '0.75rem' }}>
                  <div className="alert alert-success">
                    Congratulations! You won this auction at ${product.currentBid.toLocaleString()}.
                  </div>
                  <div className="form-group">
                    <label>Shipping Address</label>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter delivery address..."
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={checkingOut}>
                    {checkingOut ? 'Starting Checkout...' : 'Pay Winning Bid Now'}
                  </button>
                </form>
              ) : isAuctionEnded || product.status !== 'active' ? (
                <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
                  This auction has ended ({product.status}).
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                  Log in as a <strong>Product Customer</strong> to place a bid on this auction.
                </p>
              )}

              <h4 style={{ margin: '1rem 0 0.4rem' }}>Live Bid History</h4>
              {product.bids && product.bids.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Bidder</th>
                        <th>Amount</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.bids.map((b, idx) => (
                        <tr key={b._id || idx}>
                          <td>{b.bidder?.name || 'Customer'}</td>
                          <td><strong>${b.amount.toLocaleString()}</strong></td>
                          <td>{new Date(b.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', margin: 0 }}>
                  No bids yet. Be the first to bid!
                </p>
              )}
            </>
          ) : (
            <>
              <h3 style={{ margin: 0 }}>Fixed-Price Purchase &amp; Payment</h3>
              <div className="price-tag">${product.fixedPrice.toLocaleString()}</div>
              <div className="card-meta">
                <span>Available Stock: <strong>{product.stockQuantity}</strong></span>
              </div>

              {user?.role === 'product_customer' && product.stockQuantity > 0 && product.status === 'active' ? (
                <form onSubmit={handleStartCheckout} style={{ marginTop: '0.75rem' }}>
                  <div className="form-group">
                    <label htmlFor="order-qty">Quantity</label>
                    <input
                      id="order-qty"
                      type="number"
                      min={1}
                      max={product.stockQuantity}
                      className="input"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="order-address">Shipping Address</label>
                    <textarea
                      id="order-address"
                      className="textarea"
                      rows={3}
                      placeholder="Enter delivery address..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem', fontWeight: 700 }}>
                    Total: ${(product.fixedPrice * Number(quantity || 1)).toLocaleString()}
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={checkingOut}>
                    {checkingOut ? 'Starting Checkout...' : 'Proceed to Payment'}
                  </button>
                </form>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {product.stockQuantity === 0
                    ? 'Out of stock.'
                    : 'Log in as a Product Customer to purchase this item.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {showContact && (
        <ContactSupplierModal
          itemType="product"
          item={product}
          onClose={() => setShowContact(false)}
          onSuccess={() =>
            setSuccess('Your message has been sent to the product supplier. Check Inquiries for replies.')
          }
        />
      )}

      {demoCheckout && (
        <DemoPaymentModal
          checkoutData={demoCheckout}
          onClose={() => setDemoCheckout(null)}
          onPaid={(paidOrder) => {
            setDemoCheckout(null);
            navigate(`/payment-success?order_id=${paidOrder._id}`);
          }}
        />
      )}
    </div>
  );
}
