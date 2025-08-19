import React, { useEffect, useState } from 'react';
import { marketplaceService } from '../../services/marketplaceService';
import { type InventoryItem } from '../../types/[MARKET]marketplace';
import './InventoryView.css';

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const inventoryItems = await marketplaceService.fetchInventory();
      setItems(inventoryItems);
      setError(null);
    } catch (err) {
      setError('Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="inventory-view">
      <h2>Your Inventory</h2>
      <div className="inventory-grid">
        {items.map((item) => (
          <div key={item.id} className="inventory-item">
            <img src={item.image} alt={item.name} />
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <div className="item-details">
              <span className="quantity">Quantity: {item.quantity}</span>
              <span className="purchase-date">
                Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="empty-inventory">
          <p>Your inventory is empty</p>
          <p>Visit the marketplace to purchase items</p>
        </div>
      )}
    </div>
  );
};
