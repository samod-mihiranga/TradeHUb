import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ContactSupplierModal from '../components/ContactSupplierModal';

export default function RawMaterialsPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [feedback, setFeedback] = useState('');

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;
      const res = await api.get('/raw-materials', { params });
      setMaterials(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMaterials();
  };

  const categories = ['all', 'Rubber & Polymers', 'Metals & Alloys', 'Textiles & Fibers', 'Chemicals', 'Wood & Paper'];

  return (
    <div className="container">
      <div className="section-header">
        <div>
          <h2>Raw Materials Marketplace</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)' }}>
            Listed by Raw Material Suppliers — Raw Material Customers can contact suppliers directly.
          </p>
        </div>
        {user?.role === 'raw_material_supplier' && (
          <Link to="/dashboard" className="btn btn-primary">
            + Add Raw Material
          </Link>
        )}
      </div>

      {feedback && <div className="alert alert-success">{feedback}</div>}

      <form className="filter-bar" onSubmit={handleSearchSubmit}>
        <input
          className="input"
          placeholder="Search raw materials by name, description, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {loading ? (
        <div className="page-loading">Loading raw materials...</div>
      ) : materials.length === 0 ? (
        <div className="card">No raw materials match your filters yet.</div>
      ) : (
        <div className="grid grid-3">
          {materials.map((item) => (
            <div className="card" key={item._id}>
              <img
                src={item.imageUrl || '/images/raw-materials.svg'}
                alt={item.title}
                className="item-image"
                loading="lazy"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-fixed">{item.category}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{item.location}</span>
              </div>
              <h3>{item.title}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem' }}>
                {item.description}
              </p>
              {item.specifications && (
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#334155' }}>
                  <strong>Specs:</strong> {item.specifications}
                </p>
              )}
              <div className="price-tag">
                ${item.pricePerUnit.toLocaleString()}{' '}
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>/ {item.unit}</span>
              </div>
              <div className="card-meta">
                <span>MOQ: {item.minOrderQuantity} {item.unit}</span>
                <span>Stock: {item.availableQuantity} {item.unit}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Supplier: <strong>{item.supplier?.companyName || item.supplier?.name}</strong>
              </div>

              <div className="card-actions">
                {user?.role === 'raw_material_customer' ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setSelectedMaterial(item)}
                  >
                    Contact Supplier
                  </button>
                ) : !user ? (
                  <Link to="/login" className="btn btn-outline btn-sm">
                    Login as Raw Material Customer to Contact
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    {user.role === 'raw_material_supplier'
                      ? 'Manage your listings in Dashboard'
                      : 'Switch to Raw Material Customer account to inquire'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMaterial && (
        <ContactSupplierModal
          itemType="raw_material"
          item={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
          onSuccess={() =>
            setFeedback('Your inquiry has been sent to the raw material supplier. View replies in Inquiries.')
          }
        />
      )}
    </div>
  );
}
