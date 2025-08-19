import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceService } from '../../services/marketplace';
import './CartView.css';

interface CartViewProps {
  onCartUpdate: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ onCartUpdate }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cartItems = marketplaceService.getCartItems();
  const cartTotal = marketplaceService.getCartTotal();

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const cartItem = cartItems.find((item) => item.item.id === itemId);
    if (cartItem) {
      try {
        marketplaceService.addToCart(cartItem.item, quantity - cartItem.quantity);
        onCartUpdate();
      } catch (err) {
        setError('Error updating quantity');
      }
    }
  };

  const handleRemoveItem = (itemId: string) => {
    try {
      const cartItem = cartItems.find((item) => item.item.id === itemId);
      if (cartItem) {
        marketplaceService.addToCart(cartItem.item, -cartItem.quantity);
        onCartUpdate();
      }
    } catch (err) {
      setError('Error removing item');
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);
      await marketplaceService.purchaseItems();
      onCartUpdate();
      navigate('/marketplace/transactions');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error completing purchase'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-view">
      <h2>Shopping Cart</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="cart-content">
        {cartItems.length > 0 ? (
          <>
            <div className="cart-items">
              {cartItems.map((cartItem) => (
                <div key={cartItem.item.id} className="cart-item">
                  <img src={cartItem.item.image} alt={cartItem.item.name} />
                  <div className="item-info">
                    <h3>{cartItem.item.name}</h3>
                    <p>{cartItem.item.description}</p>
                    <div className="item-price">{cartItem.item.price} DP</div>
                  </div>
                  <div className="item-actions">
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          handleQuantityChange(cartItem.item.id, cartItem.quantity - 1)
                        }
                        disabled={cartItem.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{cartItem.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(cartItem.item.id, cartItem.quantity + 1)
                        }
                        disabled={cartItem.quantity >= (cartItem.item.quantity || 0)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => handleRemoveItem(cartItem.item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="cart-total">
                <span>Total:</span>
                <span>{cartTotal} DP</span>
              </div>
              <button
                className="purchase-button"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Purchase'}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <p>Add items from the marketplace to get started</p>
            <button onClick={() => navigate('/marketplace')}>
              Return to Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
