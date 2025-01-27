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
        const item = cartItems.find(item => item.id === itemId);
        if (item) {
            try {
                marketplaceService.addToCart(item, quantity - item.quantity);
                onCartUpdate();
            } catch (err) {
                setError('Error updating quantity');
            }
        }
    };

    const handleRemoveItem = (itemId: string) => {
        try {
            const item = cartItems.find(item => item.id === itemId);
            if (item) {
                marketplaceService.addToCart(item, -item.quantity);
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
            setError(err instanceof Error ? err.message : 'Error completing purchase');
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
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="item-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.description}</p>
                                        <div className="item-price">{item.price} DP</div>
                                    </div>
                                    <div className="item-actions">
                                        <div className="quantity-control">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span>{item.quantity}</span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                disabled={item.quantity >= item.stock}
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            className="remove-button"
                                            onClick={() => handleRemoveItem(item.id)}
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