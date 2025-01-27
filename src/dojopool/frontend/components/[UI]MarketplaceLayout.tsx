import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';

export const MarketplaceLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        updateCartCount();
    }, []);

    const updateCartCount = () => {
        setCartCount(marketplaceService.getCartCount());
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
        navigate(`/marketplace?search=${event.target.value}&category=${category}&sort=${sortBy}`);
    };

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(event.target.value);
        navigate(`/marketplace?search=${searchTerm}&category=${event.target.value}&sort=${sortBy}`);
    };

    const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(event.target.value);
        navigate(`/marketplace?search=${searchTerm}&category=${category}&sort=${event.target.value}`);
    };

    return (
        <div className="marketplace-container">
            <header className="marketplace-header">
                <div className="header-content">
                    <h1>Dojo Pool Marketplace</h1>
                    <div className="marketplace-search">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="search-input"
                        />
                    </div>
                    <div className="marketplace-filters">
                        <div className="filter-group">
                            <label htmlFor="category-select">Category</label>
                            <select
                                id="category-select"
                                value={category}
                                onChange={handleCategoryChange}
                                className="filter-select"
                            >
                                <option value="all">All Categories</option>
                                <option value="power-ups">Power-ups</option>
                                <option value="avatars">Avatars</option>
                                <option value="accessories">Accessories</option>
                                <option value="special">Special Items</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="sort-select">Sort by</label>
                            <select
                                id="sort-select"
                                value={sortBy}
                                onChange={handleSortChange}
                                className="filter-select"
                            >
                                <option value="newest">Newest</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="popular">Most Popular</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>
            <div className="marketplace-content">
                {/* Main content will be rendered here */}
            </div>
            <footer className="marketplace-footer">
                <div className="footer-content">
                    <button
                        className="nav-button"
                        onClick={() => navigate('/marketplace/transactions')}
                    >
                        <i className="bi bi-clock-history" />
                        Transaction History
                    </button>
                    <button
                        className="nav-button"
                        onClick={() => navigate('/marketplace/cart')}
                    >
                        <i className="bi bi-cart" />
                        <span className="cart-count">{cartCount}</span>
                        Cart
                    </button>
                </div>
            </footer>
        </div>
    );
}; 