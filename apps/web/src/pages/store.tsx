import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import api from '../services/api';

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  imageUrl: string;
}

const Store = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refetchUser } = useAuth();

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await api.get('/store/catalog');
        setItems(response.data);
      } catch (err) {
        setError('Failed to fetch store catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handlePurchase = async (itemId: string) => {
    try {
      await api.post('/store/purchase', { itemId });
      alert('Purchase successful!');
      await refetchUser();
    } catch (err) {
      alert('Purchase failed.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Store</h1>
      <p>Dojo Coins: {user?.dojoCoinBalance || 0}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              width: '200px',
            }}
          >
            <img
              src={item.imageUrl || 'https://via.placeholder.com/150'}
              alt={item.name}
              style={{ width: '100%' }}
            />
            <h3>{item.name}</h3>
            <p>{item.description}</p>
            <p>Price: {item.price} Dojo Coins</p>
            <button onClick={() => handlePurchase(item.id)}>Purchase</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;
