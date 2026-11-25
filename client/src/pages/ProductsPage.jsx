import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import socket from '../api/socket';
import { useAuth } from '../context/AuthContext';
import CountdownTimer from '../components/CountdownTimer';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [pricingType, setPricingType] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (pricingType !== 'all') params.pricingType = pricingType;
      const res = await api.get('/products', { params });
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pricingType]);

  // Listen for live auction bid summaries over WebSockets
  useEffect(() => {
    const handleBidSummary = ({ productId, currentBid, bidCount, highestBidder }) => {
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? {
                ...p,
                currentBid,
                highestBidder,
                bids: Array.from({ length: bidCount }),
              }
            : p
        )
      );
    };

    socket.on('product_bid_summary', handleBidSummary);
    return () => {
      socket.off('product_bid_summary', handleBidSummary);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="container">
      <div className="section-header">
        <div>
          <h2>Finished Products &amp; Auctions</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
            Browse fixed-price finished goods or bid in real-time timed auctions from Product Suppliers.
          </p>
        </div>
        {user?.role === 'product_supplier' && (
          <Link to="/dashboard" className="btn btn-primary">
            + Add Finished Product
          </Link>
        )}
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
        <input
          className="input"
          placeholder="Search finished products by title, category, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          value={pricingType}
          onChange={(e) => setPricingType(e.target.value)}
        >
          <option value="all">All Pricing Types</option>
          <option value="fixed">Fixed Price Only</option>
          <option value="auction">Auctions Only</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {loading ? (
        <div className="page-loading">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="card">No finished products match your filters.</div>
      ) : (
        <div className="grid grid-3">
          {products.map((product) => (
            <div className="card" key={product._id}>
              <img
                src={product.imageUrl || '/images/finished-products.svg'}
                alt={product.title}
                className="item-image"
                loading="lazy"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className={`badge ${
                    product.pricingType === 'auction' ? 'badge-auction' : 'badge-fixed'
                  }`}
                >
                  {product.pricingType === 'auction' ? 'Auction' : 'Fixed Price'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{product.category}</span>
              </div>

              <h3>{product.title}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
                {product.description.slice(0, 120)}
                {product.description.length > 120 ? '...' : ''}
              </p>

              {product.pricingType === 'auction' ? (
                <>
                  <CountdownTimer
                    startTime={product.auctionStartTime}
                    endTime={product.auctionEndTime}
                  />
                  <div className="price-tag">
                    ${(product.currentBid || product.startingPrice).toLocaleString()}
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--muted)' }}>
                      {' '}
                      {product.currentBid > 0
                        ? `(${product.bids?.length || 0} bids)`
                        : '(Starting Price)'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="price-tag">${product.fixedPrice.toLocaleString()}</div>
                  <div className="card-meta">
                    <span>Stock: {product.stockQuantity}</span>
                    <span>Status: {product.status}</span>
                  </div>
                </>
              )}

              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Supplier: <strong>{product.supplier?.companyName || product.supplier?.name}</strong>
              </div>

              <div className="card-actions">
                <Link to={`/products/${product._id}`} className="btn btn-primary btn-sm">
                  {product.pricingType === 'auction' ? 'Place Bid / Contact' : 'Buy & Pay / Contact'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
