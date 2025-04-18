import React, { useEffect, useState } from "react";
import { abTestingService } from "../services/abTesting";

interface ABTestResultsProps {
  testId: string;
  refreshInterval?: number;
}

export const ABTestResults: React.FC<ABTestResultsProps> = ({
  testId,
  refreshInterval = 60000, // 1 minute default
}) => {
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = () => {
      try {
        const testResults = abTestingService.getTestResults(testId);
        setResults(testResults);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch test results",
        );
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, refreshInterval);

    return () => clearInterval(interval);
  }, [testId, refreshInterval]);

  if (error) {
    return (
      <div className="ab-test-results-error">
        <h3>Error Loading Test Results</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="ab-test-results-loading">
        <p>Loading test results...</p>
      </div>
    );
  }

  return (
    <div className="ab-test-results">
      <h2>{results.testName} Results</h2>

      <div className="variants-grid">
        {Object.entries(results.variants).map(
          ([variantName, variantData]: [string, any]) => (
            <div key={variantName} className="variant-card">
              <h3>{variantName}</h3>
              <p>Users: {variantData.users}</p>

              <div className="metrics">
                <h4>Metrics</h4>
                {Object.entries(variantData.metrics).map(
                  ([metricName, metricData]: [string, any]) => (
                    <div key={metricName} className="metric">
                      <h5>{metricName}</h5>
                      <ul>
                        <li>Count: {metricData.count}</li>
                        <li>Average: {metricData.average.toFixed(2)}</li>
                        <li>Min: {metricData.min}</li>
                        <li>Max: {metricData.max}</li>
                      </ul>
                    </div>
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <style jsx>{`
        .ab-test-results {
          padding: 20px;
        }

        .variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .variant-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 15px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metrics {
          margin-top: 15px;
        }

        .metric {
          margin-top: 10px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .metric ul {
          list-style: none;
          padding: 0;
          margin: 5px 0 0;
        }

        .metric li {
          margin: 3px 0;
          font-size: 0.9em;
        }

        .ab-test-results-error {
          color: #dc3545;
          padding: 20px;
          text-align: center;
        }

        .ab-test-results-loading {
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};
