import React, { useEffect, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface VariantResult {
    variant_id: string;
    sample_size: number;
    conversion_rate: number;
    mean_value: number;
    std_dev: number;
    confidence_interval: [number, number];
}

interface ExperimentResult {
    experiment_id: string;
    control_results: VariantResult;
    variant_results: VariantResult[];
    p_value: number;
    is_significant: boolean;
    minimum_detectable_effect: number;
    power: number;
}

interface Props {
    experimentId: string;
    onRefresh?: () => void;
}

export const ExperimentDashboard: React.FC<Props> = ({ experimentId, onRefresh }) => {
    const [results, setResults] = useState<ExperimentResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchResults();
    }, [experimentId]);

    const fetchResults = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/experiments/${experimentId}/results`);
            if (!response.ok) {
                throw new Error('Failed to fetch results');
            }
            const data = await response.json();
            setResults(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatPValue = (p: number): string => {
        if (p < 0.001) return 'p < 0.001';
        return `p = ${p.toFixed(3)}`;
    };

    const getSignificanceLabel = (p: number, power: number): string => {
        if (p >= 0.05) return 'Not Significant';
        if (power < 0.8) return 'Significant but Low Power';
        return 'Statistically Significant';
    };

    const getVariantData = () => {
        if (!results) return [];
        return [
            {
                name: 'Control',
                value: results.control_results.mean_value,
                ci_lower: results.control_results.confidence_interval[0],
                ci_upper: results.control_results.confidence_interval[1]
            },
            ...results.variant_results.map(variant => ({
                name: variant.variant_id,
                value: variant.mean_value,
                ci_lower: variant.confidence_interval[0],
                ci_upper: variant.confidence_interval[1]
            }))
        ];
    };

    if (loading) {
        return <div className="loading">Loading experiment results...</div>;
    }

    if (error) {
        return (
            <div className="error">
                <p>Error: {error}</p>
                <button onClick={fetchResults}>Retry</button>
            </div>
        );
    }

    if (!results) {
        return <div>No results available</div>;
    }

    return (
        <div className="experiment-dashboard">
            <div className="header">
                <h2>Experiment Results: {experimentId}</h2>
                <button onClick={onRefresh} className="refresh-button">
                    Refresh
                </button>
            </div>

            <div className="stats-summary">
                <div className="stat-box">
                    <h3>Statistical Significance</h3>
                    <p className={results.is_significant ? 'significant' : 'not-significant'}>
                        {getSignificanceLabel(results.p_value, results.power)}
                    </p>
                    <p className="p-value">{formatPValue(results.p_value)}</p>
                </div>

                <div className="stat-box">
                    <h3>Statistical Power</h3>
                    <p className={results.power >= 0.8 ? 'good-power' : 'low-power'}>
                        {(results.power * 100).toFixed(1)}%
                    </p>
                </div>

                <div className="stat-box">
                    <h3>Sample Sizes</h3>
                    <p>Control: {results.control_results.sample_size}</p>
                    {results.variant_results.map(variant => (
                        <p key={variant.variant_id}>
                            {variant.variant_id}: {variant.sample_size}
                        </p>
                    ))}
                </div>
            </div>

            <div className="charts">
                <div className="chart-container">
                    <h3>Mean Values with Confidence Intervals</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getVariantData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                            <Bar dataKey="ci_lower" fill="#82ca9d" />
                            <Bar dataKey="ci_upper" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container">
                    <h3>Conversion Rates</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={[
                                {
                                    name: 'Control',
                                    rate: results.control_results.conversion_rate * 100
                                },
                                ...results.variant_results.map(variant => ({
                                    name: variant.variant_id,
                                    rate: variant.conversion_rate * 100
                                }))
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis unit="%" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="rate" fill="#82ca9d" name="Conversion Rate" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <style jsx>{`
        .experiment-dashboard {
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .refresh-button {
          padding: 8px 16px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-box {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .significant {
          color: #2ecc71;
          font-weight: bold;
        }

        .not-significant {
          color: #e74c3c;
          font-weight: bold;
        }

        .good-power {
          color: #2ecc71;
          font-weight: bold;
        }

        .low-power {
          color: #f1c40f;
          font-weight: bold;
        }

        .charts {
          display: grid;
          grid-template-columns: 1fr;
          gap: 30px;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        @media (min-width: 1200px) {
          .charts {
            grid-template-columns: 1fr 1fr;
          }
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 1.2em;
          color: #666;
        }

        .error {
          text-align: center;
          padding: 40px;
          color: #e74c3c;
        }
      `}</style>
        </div>
    );
}; 