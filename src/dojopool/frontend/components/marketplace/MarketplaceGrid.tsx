import React from 'react';
import './MarketplaceGrid.css';

interface MarketplaceItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    stock: number;
}

interface MarketplaceGridProps {
    items: MarketplaceItem[];
    onItemClick: (item: MarketplaceItem) => void;
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({ items, onItemClick }) => {
    const getRarityColor = (rarity: string): string => {
        switch (rarity) {
            case 'legendary':
                return '#ffd700';
            case 'epic':
                return '#a335ee';
            case 'rare':
                return '#0070dd';
            default:
                return '#ffffff';
        }
    };

    return (
        <div className="marketplace-grid">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="item-card"
                    onClick={() => onItemClick(item)}
                    style={{
                        '--rarity-color': getRarityColor(item.rarity)
                    } as React.CSSProperties}
                >
                    <div className="item-image">
                        <img src={item.image} alt={item.name} />
                        <div className="item-rarity">{item.rarity}</div>
                    </div>
                    <div className="item-info">
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        <div className="item-footer">
                            <div className="item-price">
                                <i className="bi bi-coin"></i>
                                <span>{item.price} DP</span>
                            </div>
                            <div className="item-stock">
                                {item.stock > 0 ? (
                                    <span className="in-stock">
                                        {item.stock} available
                                    </span>
                                ) : (
                                    <span className="out-of-stock">
                                        Out of stock
                                    </span>
                                )}
                            </div>
                        </div>
                        <button 
                            className="add-to-cart-btn"
                            disabled={item.stock === 0}
                        >
                            <i className="bi bi-cart-plus"></i>
                            Add to Cart
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MarketplaceGrid; 