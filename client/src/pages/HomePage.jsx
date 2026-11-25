import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import CountdownTimer from '../components/CountdownTimer';

export default function HomePage() {
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/raw-materials'), api.get('/products')])
      .then(([matRes, prodRes]) => {
        setMaterials(matRes.data.slice(0, 3));
        setProducts(prodRes.data.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>One Marketplace for Raw Materials &amp; Finished Products</h1>
            <p>
              Connect raw material suppliers directly with manufacturers, and let finished product
              suppliers sell at fixed prices or run timed auctions with live bidding.
            </p>
            <div className="hero-actions">
              <Link to="/raw-materials" className="btn btn-primary">
                Browse Raw Materials
              </Link>
              <Link to="/products" className="btn btn-accent">
                Explore Products &amp; Auctions
              </Link>
              <Link to="/register" className="btn btn-outline">
                Create Supplier / Customer Account
              </Link>
            </div>
          </div>
          <img
            src="/images/marketplace.svg"
            alt="Illustration of suppliers and products moving through a marketplace"
            className="hero-image"
          />
        </div>
      </section>

      <div className="container">
        <div className="grid grid-4" style={{ marginBottom: '2.25rem' }}>
          <div className="card">
            <h3>Raw Material Suppliers</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.92rem' }}>
              Publish bulk industrial materials with unit pricing, MOQ, and respond to buyer quotes.
            </p>
          </div>
          <div className="card">
            <h3>Raw Material Customers</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.92rem' }}>
              Source verified raw inputs and message suppliers directly for bulk contracts.
            </p>
          </div>
          <div className="card">
            <h3>Product Suppliers</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.92rem' }}>
              List finished goods with fixed pricing or timed auctions with custom bid increments.
            </p>
          </div>
          <div className="card">
            <h3>Product Customers</h3>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.92rem' }}>
              Buy fixed-price goods immediately, compete in live auctions, or contact suppliers.
            </p>
          </div>
        </div>

        <div className="section-header">
          <h2>Featured Finished Products &amp; Live Auctions</h2>
          <Link to="/products">View all products →</Link>
        </div>
        <div className="grid grid-2">
          {products.map((product) => (
            <div className="card" key={product._id}>
              <img
                src={product.imageUrl || '/images/finished-products.svg'}
                alt={product.title}
                className="item-image"
                loading="lazy"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge ${product.pricingType === 'auction' ? 'badge-auction' : 'badge-fixed'}`}>
                  {product.pricingType === 'auction' ? 'Auction' : 'Fixed Price'}
                </span>
                {product.pricingType === 'auction' && (
                  <CountdownTimer
                    startTime={product.auctionStartTime}
                    endTime={product.auctionEndTime}
                  />
                )}
              </div>
              <h3>{product.title}</h3>
              <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.92rem' }}>
                {product.description.slice(0, 120)}
                {product.description.length > 120 ? '...' : ''}
              </p>
              <div className="price-tag">
                {product.pricingType === 'auction'
                  ? `$${(product.currentBid || product.startingPrice).toLocaleString()} ${
                      product.currentBid > 0 ? '(Current Bid)' : '(Starting Bid)'
                    }`
                  : `$${product.fixedPrice.toLocaleString()}`}
              </div>
              <div className="card-actions">
                <Link to={`/products/${product._id}`} className="btn btn-primary btn-sm">
                  {product.pricingType === 'auction' ? 'View Auction & Bid' : 'View Details'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="section-header">
          <h2>Latest Raw Materials</h2>
          <Link to="/raw-materials">View all raw materials →</Link>
        </div>
        <div className="grid grid-3">
          {materials.map((m) => (
            <div className="card" key={m._id}>
              <img
                src={m.imageUrl || '/images/raw-materials.svg'}
                alt={m.title}
                className="item-image"
                loading="lazy"
              />
              <span className="badge badge-fixed">{m.category}</span>
              <h3>{m.title}</h3>
              <div className="price-tag">
                ${m.pricePerUnit.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>/ {m.unit}</span>
              </div>
              <div className="card-meta">
                <span>MOQ: {m.minOrderQuantity} {m.unit}</span>
                <span>Available: {m.availableQuantity} {m.unit}</span>
              </div>
              <div className="card-actions">
                <Link to="/raw-materials" className="btn btn-outline btn-sm">
                  Inspect &amp; Contact Supplier
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
