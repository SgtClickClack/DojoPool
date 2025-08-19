import React, { useEffect, useState } from 'react';
import { marketplaceService } from '../../services/marketplace';
import { type Transaction } from '../../types/marketplace';
import './TransactionHistory.css';

export const TransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionHistory = await marketplaceService.fetchTransactions();
      setTransactions(transactionHistory);
      setError(null);
    } catch (err) {
      setError('Error loading transaction history');
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
    <div className="transaction-history-view">
      <h2>Transaction History</h2>
      <div className="transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-card">
            <div className="transaction-header">
              <span className="transaction-id">ID: {transaction.id}</span>
              <span
                className={`transaction-status status-${transaction.status}`}
              >
                {transaction.status}
              </span>
            </div>
            <div className="transaction-items">
              {transaction.items.map((item, index) => (
                <div
                  key={`${transaction.id}-${index}`}
                  className="transaction-item"
                >
                  <img src={item.image} alt={item.name} />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <div className="item-details">
                      <span className="quantity">
                        Quantity: {item.quantity}
                      </span>
                      <span className="price">
                        Price: {item.priceAtPurchase} DP
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="transaction-footer">
              <span className="transaction-total">
                Total: {transaction.total} DP
              </span>
              <span className="transaction-date">
                {new Date(transaction.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {transactions.length === 0 && (
        <div className="empty-transactions">
          <p>No transactions found</p>
          <p>Your purchase history will appear here</p>
        </div>
      )}
    </div>
  );
};
