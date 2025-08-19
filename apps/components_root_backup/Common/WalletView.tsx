import React, { useState, useEffect } from 'react';

// Updated types based on backend API structure
interface WalletInfo {
  id: number; // Added wallet ID
  user_id: number;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface Transaction {
  id: string;
  wallet_id: number;
  transaction_type: string; // Renamed from 'type'
  amount: number;
  description: string;
  metadata: any; // Added metadata field
  created_at: string; // Renamed from 'timestamp'
}

const WalletView: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      setIsLoading(true);
      setError(null);
      let fetchedWalletId: number | null = null;

      try {
        // Step 1: Fetch wallet information
        const walletResponse = await fetch('/api/v1/wallet'); // Updated endpoint
        if (!walletResponse.ok) {
          const errorData = await walletResponse.json().catch(() => ({})); // Try to parse error
          throw new Error(
            errorData?.error ||
              `Failed to fetch wallet: ${walletResponse.statusText}`
          );
        }
        const walletData: WalletInfo = await walletResponse.json();
        setWalletInfo(walletData);
        fetchedWalletId = walletData.id; // Store wallet ID for next call

        // Step 2: Fetch transaction history using the fetched wallet ID
        if (fetchedWalletId) {
          const txResponse = await fetch(
            `/api/v1/wallet/${fetchedWalletId}/transactions`
          ); // Updated endpoint with ID
          if (!txResponse.ok) {
            const errorData = await txResponse.json().catch(() => ({})); // Try to parse error
            throw new Error(
              errorData?.error ||
                `Failed to fetch transactions: ${txResponse.statusText}`
            );
          }
          const txData: Transaction[] = await txResponse.json();
          setTransactions(txData);
        } else {
          throw new Error(
            'Could not determine wallet ID to fetch transactions.'
          );
        }
      } catch (err: any) {
        console.error('Failed to load wallet data:', err);
        setError(err.message || 'Could not load wallet information.');
        // Removed fake data fallback to show real errors
        setWalletInfo(null); // Clear potentially partial data
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  if (isLoading) {
    return <div className="text-center p-4">Loading Wallet...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (!walletInfo) {
    return (
      <div className="text-center p-4">Could not load wallet information.</div>
    );
  }

  return (
    <div className="border p-4 rounded shadow">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Balance</h2>
        <p className="text-3xl">
          {walletInfo.balance.toFixed(2)}{' '}
          <span className="text-lg">{walletInfo.currency}</span>
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Transaction History</h2>
        {transactions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium capitalize">
                    {tx.transaction_type}: {tx.description || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
                <p
                  className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount.toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No transactions found.</p>
        )}
      </div>
    </div>
  );
};

export default WalletView;
