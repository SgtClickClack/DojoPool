import React from 'react';
import styles from './MarketplaceGrid.module.css';

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
  onBuyItem: (item: MarketplaceItem) => void;
  userBalance: number;
  isLoading: boolean;
}

export const MarketplaceGrid: React.FC<MarketplaceGridProps> = ({
  items,
  onBuyItem,
  userBalance,
  isLoading,
}) => {
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
          className={`item-card ${styles.itemCard}`}
          data-rarity={item.rarity}
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
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {item.price} DojoCoins
                </span>
              </div>
              <div className="item-stock">
                {item.stock > 0 ? (
                  <span className="in-stock">{item.stock} available</span>
                ) : (
                  <span className="out-of-stock">Out of stock</span>
                )}
              </div>
            </div>
            <button
              className="add-to-cart-btn"
              disabled={
                item.stock === 0 || isLoading || userBalance < item.price
              }
              onClick={() => onBuyItem(item)}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                background: userBalance < item.price ? '#ccc' : '#1976d2',
                color: 'white',
                cursor:
                  userBalance < item.price || item.stock === 0
                    ? 'not-allowed'
                    : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {userBalance < item.price
                ? 'Insufficient Coins'
                : item.stock === 0
                  ? 'Out of Stock'
                  : 'Buy Now'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketplaceGrid;
