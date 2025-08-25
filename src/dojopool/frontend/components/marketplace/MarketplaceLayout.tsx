import React, { useEffect, useState } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplace';
import { type MarketplaceItem } from '../../types/marketplace';
import { CartView } from './[MARKET]CartView';
import { InventoryView } from './[MARKET]InventoryView';
import './MarketplaceLayout.css';
import { TransactionHistory } from './[MARKET]TransactionHistory';

export const MarketplaceLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(marketplaceService.getCartCount());

  const updateCartCount = () => {
    setCartCount(marketplaceService.getCartCount());
  };

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1>Dojo Pool Marketplace</h1>
          {location.pathname === '/marketplace' && (
            <>
              <div className="marketplace-search">
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search items..."
                  onChange={(e) =>
                    navigate(`/marketplace?search=${e.target.value}`)
                  }
                />
              </div>
              <div className="marketplace-filters">
                <div className="filter-group">
                  <label htmlFor="category-select">Category</label>
                  <select
                    id="category-select"
                    className="filter-select"
                    aria-label="Category"
                    onChange={(e) =>
                      navigate(`/marketplace?category=${e.target.value}`)
                    }
                  >
                    <option value="">All Categories</option>
                    <option value="power-ups">Power-ups</option>
                    <option value="avatars">Avatar Items</option>
                    <option value="accessories">Accessories</option>
                    <option value="special">Special Items</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="sort-select">Sort By</label>
                  <select
                    id="sort-select"
                    className="filter-select"
                    aria-label="Sort by"
                    onChange={(e) =>
                      navigate(`/marketplace?sort=${e.target.value}`)
                    }
                  >
                    <option value="">Sort By</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route
          path="/"
          element={<MarketplaceMain onCartUpdate={updateCartCount} />}
        />
        <Route path="/inventory" element={<InventoryView />} />
        <Route
          path="/cart"
          element={<CartView onCartUpdate={updateCartCount} />}
        />
        <Route path="/transactions" element={<TransactionHistory />} />
      </Routes>

      <footer className="marketplace-footer">
        <div className="footer-content">
          <div
            className="transaction-history"
            onClick={() => navigate('/marketplace/transactions')}
          >
            <i className="bi bi-clock-history" />
            Transaction History
          </div>
          <div
            className="cart-preview"
            onClick={() => navigate('/marketplace/cart')}
          >
            <i className="bi bi-cart" />
            <span className="cart-count">{cartCount}</span>
            Cart
          </div>
        </div>
      </footer>
    </div>
  );
};

interface MarketplaceMainProps {
  onCartUpdate: () => void;
}

const MarketplaceMain: React.FC<MarketplaceMainProps> = ({ onCartUpdate }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: '',
  });

  useEffect(() => {
    loadMarketplaceData();
  }, [filters]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const [fetchedItems, balance] = await Promise.all([
        marketplaceService.fetchItems(filters),
        marketplaceService.getWalletBalance(),
      ]);
      setItems(fetchedItems);
      setWalletBalance(balance);
      setError(null);
    } catch (err) {
      setError('Error loading items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MarketplaceItem) => {
    try {
      marketplaceService.addToCart(item, 1);
      onCartUpdate();
    } catch (err) {
      setError('Error adding item to cart');
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, sortBy: e.target.value }));
  };

  return (
    <div className="marketplace-content">
      <aside className="marketplace-sidebar">
        <div className="wallet-info">
          <h3>Your Wallet</h3>
          <div className="balance">
            <i className="bi bi-coin" />
            <span>{walletBalance} DP</span>
          </div>
        </div>
        <nav className="marketplace-nav">
          <h3>Categories</h3>
          <ul>
            <li
              className={`nav-item ${filters.category === 'power-ups' ? 'active' : ''}`}
            >
              <i className="bi bi-lightning-charge" />
              Power-ups
            </li>
            <li
              className={`nav-item ${filters.category === 'avatars' ? 'active' : ''}`}
            >
              <i className="bi bi-person-circle" />
              Avatar Items
            </li>
            <li
              className={`nav-item ${filters.category === 'accessories' ? 'active' : ''}`}
            >
              <i className="bi bi-stars" />
              Accessories
            </li>
            <li
              className={`nav-item ${filters.category === 'special' ? 'active' : ''}`}
            >
              <i className="bi bi-gift" />
              Special Items
            </li>
          </ul>
        </nav>
        <div className="inventory-preview">
          <h3>Your Inventory</h3>
          <div className="inventory-stats">
            <div className="stat">
              <label>Power-ups</label>
              <span>5</span>
            </div>
            <div className="stat">
              <label>Avatars</label>
              <span>3</span>
            </div>
            <div className="stat">
              <label>Accessories</label>
              <span>7</span>
            </div>
          </div>
          <button
            className="view-inventory-btn"
            onClick={() => navigate('/marketplace/inventory')}
          >
            View Full Inventory
          </button>
        </div>
      </aside>

      <main className="marketplace-main">
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="items-grid">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                <img src={item.image} alt={item.name} />
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="item-price">{item.price} DP</div>
                <button
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(item)}
                  disabled={item.stock === 0}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MarketplaceLayout;
