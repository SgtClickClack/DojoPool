import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { abTestingService } from '../services/abTesting';

export function useABTest<T = any>(testId: string, defaultValue: T): T {
  const [variant, setVariant] = useState<T>(defaultValue);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const testVariant = abTestingService.getVariantForUser(testId, user.uid);
    if (testVariant) {
      setVariant(testVariant.config as T);
    }
  }, [testId, user]);

  return variant;
}

export function useABTestMetric(testId: string) {
  const { user } = useAuth();

  const trackMetric = (metricName: string, value: number) => {
    if (!user) return;
    abTestingService.trackMetric(testId, user.uid, metricName, value);
  };

  return trackMetric;
}
