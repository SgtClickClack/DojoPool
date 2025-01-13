import React, { useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './MarketplaceLayout.css';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const categories: Category[] = [
  { id: 'power-ups', name: 'Power-ups', icon: 'bi-lightning-charge' },
  { id: 'avatars', name: 'Avatar Items', icon: 'bi-person-circle' },
  { id: 'accessories', name: 'Accessories', icon: 'bi-stars' },
  { id: 'special', name: 'Special Items', icon: 'bi-gift' },
];

export const MarketplaceLayout: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('power-ups');
  const [sortBy, setSortBy] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    // TODO: Implement search functionality
  }, []);

  const handleCategoryChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const category = event.target.value;
      setSelectedCategory(category);
      navigate(`/marketplace/${category}`);
    },
    [navigate]
  );

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
    // TODO: Implement sorting functionality
  }, []);

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      navigate(`/marketplace/${categoryId}`);
    },
    [navigate]
  );

  const handleViewInventory = useCallback(() => {
    navigate('/marketplace/inventory');
  }, [navigate]);

  const handleViewTransactions = useCallback(() => {
    navigate('/marketplace/transactions');
  }, [navigate]);

  const handleViewCart = useCallback(() => {
    navigate('/marketplace/cart');
  }, [navigate]);

  return (
    <div className="marketplace-container">
      <header className="marketplace-header">
        <div className="header-content">
          <h1>Dojo Pool Marketplace</h1>
          <div className="marketplace-search">
            <input
              type="search"
              placeholder="Search items..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          <div className="marketplace-filters">
            <select
              className="filter-select"
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select className="filter-select" value={sortBy} onChange={handleSortChange}>
              <option value="">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </header>

      <div className="marketplace-content">
        <aside className="marketplace-sidebar">
          <div className="wallet-info">
            <h3>Your Wallet</h3>
            <div className="balance">
              <i className="bi bi-coin"></i>
              <span>1,000 DP</span>
            </div>
          </div>

          <nav className="marketplace-nav">
            <h3>Categories</h3>
            <ul>
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={`nav-item ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <i className={`bi ${category.icon}`}></i>
                  {category.name}
                </li>
              ))}
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
            <button className="view-inventory-btn" onClick={handleViewInventory}>
              View Full Inventory
            </button>
          </div>
        </aside>

        <main className="marketplace-main">
          <Outlet />
        </main>
      </div>

      <footer className="marketplace-footer">
        <div className="footer-content">
          <div className="transaction-history" onClick={handleViewTransactions}>
            <i className="bi bi-clock-history"></i>
            Transaction History
          </div>
          <div className="cart-preview" onClick={handleViewCart}>
            <i className="bi bi-cart"></i>
            <span className="cart-count">{cartCount}</span>
            Cart
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketplaceLayout;
