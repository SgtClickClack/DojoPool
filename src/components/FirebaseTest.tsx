import React, { useEffect, useState, useCallback } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  orderBy, 
  getDoc, 
  doc, 
  QuerySnapshot, 
  DocumentData,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface TestData {
  id: string;
  timestamp: Date;
  performance: {
    queryTime: number;
    cacheHit: boolean;
    networkTime: number;
    processingTime: number;
  };
}

interface PerformanceMetrics {
  queryTime: number;
  cacheHit: boolean;
  networkTime: number;
  processingTime: number;
  cacheSize: number;
  averageQueryTime: number;
  cacheHitRate: number;
}

interface CacheEntry {
  data: QuerySnapshot<DocumentData>;
  timestamp: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalQueries: number;
  lastOptimization: number;
}

// Cache implementation with dynamic optimization
const cache = new Map<string, CacheEntry>();
const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  totalQueries: 0,
  lastOptimization: Date.now()
};

// Initial cache settings
let CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let CACHE_SIZE = 100;
const OPTIMIZATION_INTERVAL = 10 * 60 * 1000; // 10 minutes
const TARGET_QUERY_TIME = 100; // 100ms target query time
const MIN_CACHE_DURATION = 1 * 60 * 1000; // 1 minute
const MAX_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const FirebaseTest: React.FC = () => {
  const [testData, setTestData] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [isAddingTest, setIsAddingTest] = useState(false);

  const optimizeCache = useCallback(() => {
    const now = Date.now();
    if (now - cacheStats.lastOptimization < OPTIMIZATION_INTERVAL) {
      return;
    }

    // Calculate cache hit rate
    const hitRate = cacheStats.totalQueries > 0 
      ? cacheStats.hits / cacheStats.totalQueries 
      : 0;

    // Adjust cache duration based on performance
    if (performance?.queryTime && performance.queryTime > TARGET_QUERY_TIME) {
      // Increase cache duration if queries are slow
      CACHE_DURATION = Math.min(
        CACHE_DURATION * 1.2,
        MAX_CACHE_DURATION
      );
    } else if (hitRate < 0.5) {
      // Decrease cache duration if hit rate is low
      CACHE_DURATION = Math.max(
        CACHE_DURATION * 0.8,
        MIN_CACHE_DURATION
      );
    }

    // Reset stats
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.totalQueries = 0;
    cacheStats.lastOptimization = now;

    // Clear old cache entries
    const entries = Array.from(cache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }
  }, [performance]);

  const clearOldCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.entries());
    for (const [key, value] of entries) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }
    if (cache.size > CACHE_SIZE) {
      const oldestKey = entries
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      cache.delete(oldestKey);
    }
  }, []);

  const addTestDocument = async () => {
    try {
      setIsAddingTest(true);
      await addDoc(collection(db, 'test_collection'), {
        timestamp: serverTimestamp(),
        testData: 'Test document ' + new Date().toISOString()
      });
      // Clear cache to force a fresh fetch
      cache.clear();
      // Reset cache stats
      cacheStats.hits = 0;
      cacheStats.misses = 0;
      cacheStats.totalQueries = 0;
      // Refetch data
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add test document');
    } finally {
      setIsAddingTest(false);
    }
  };

  const fetchData = async () => {
    try {
      const startTime = window.performance.now();
      clearOldCache();
      optimizeCache();
      
      // Check cache first
      const cacheKey = 'test_collection';
      const cachedData = cache.get(cacheKey);
      
      let querySnapshot: QuerySnapshot<DocumentData>;
      let networkTime = 0;
      let processingTime = 0;
      let isCacheHit = false;

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        querySnapshot = cachedData.data;
        isCacheHit = true;
        cacheStats.hits++;
      } else {
        const networkStart = window.performance.now();
        // Create a test query with optimizations
        const testQuery = query(
          collection(db, 'test_collection'),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
        querySnapshot = await getDocs(testQuery);
        networkTime = window.performance.now() - networkStart;
        cacheStats.misses++;
        
        // Cache the results
        cache.set(cacheKey, {
          data: querySnapshot,
          timestamp: Date.now()
        });
      }
      cacheStats.totalQueries++;

      const processingStart = window.performance.now();
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        timestamp: doc.data().timestamp?.toDate() || new Date(),
        performance: {
          queryTime: window.performance.now() - startTime,
          cacheHit: isCacheHit,
          networkTime,
          processingTime: window.performance.now() - processingStart
        }
      }));
      processingTime = window.performance.now() - processingStart;

      setTestData(data);
      setPerformance({
        queryTime: window.performance.now() - startTime,
        cacheHit: isCacheHit,
        networkTime,
        processingTime,
        cacheSize: cache.size,
        averageQueryTime: cacheStats.totalQueries > 0 
          ? (performance?.queryTime || 0) / cacheStats.totalQueries 
          : 0,
        cacheHitRate: cacheStats.totalQueries > 0 
          ? cacheStats.hits / cacheStats.totalQueries 
          : 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clearOldCache, optimizeCache]);

  if (loading) {
    return <div>Loading Firebase test data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Firebase Connection Test</h2>
        <button
          onClick={addTestDocument}
          disabled={isAddingTest}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isAddingTest ? 'Adding...' : 'Add Test Document'}
        </button>
      </div>
      
      {performance && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <h3 className="font-semibold">Performance Metrics:</h3>
          <p>Total Query Time: {performance.queryTime.toFixed(2)}ms</p>
          <p>Network Time: {performance.networkTime.toFixed(2)}ms</p>
          <p>Processing Time: {performance.processingTime.toFixed(2)}ms</p>
          <p>Cache Hit: {performance.cacheHit ? 'Yes' : 'No'}</p>
          <p>Cache Size: {performance.cacheSize} items</p>
          <p>Cache Duration: {(CACHE_DURATION / 1000).toFixed(1)}s</p>
          <p>Cache Hit Rate: {(performance.cacheHitRate * 100).toFixed(1)}%</p>
          <p>Average Query Time: {performance.averageQueryTime.toFixed(2)}ms</p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold">Test Data:</h3>
        {testData.map(item => (
          <div key={item.id} className="p-2 bg-white border rounded">
            <p>ID: {item.id}</p>
            <p>Timestamp: {item.timestamp.toLocaleString()}</p>
            <p className="text-sm text-gray-600">
              Cache Hit: {item.performance.cacheHit ? 'Yes' : 'No'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}; 