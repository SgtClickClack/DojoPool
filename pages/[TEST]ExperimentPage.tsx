import React, { useState } from 'react';
import { ExperimentDashboard } from '../components/ExperimentDashboard';

interface ExperimentInfo {
  id: string;
  name: string;
  description: string;
  startDate: string;
}

const SAMPLE_EXPERIMENTS: ExperimentInfo[] = [
  {
    id: 'image_compression_test',
    name: 'Image Compression Quality',
    description:
      'Testing different compression quality settings for optimal file size vs. visual quality.',
    startDate: '2024-03-01',
  },
  {
    id: 'loading_strategy_test',
    name: 'Image Loading Strategy',
    description:
      'Comparing eager vs. lazy loading for different page sections.',
    startDate: '2024-03-15',
  },
  {
    id: 'format_conversion_test',
    name: 'Format Conversion Strategy',
    description: 'Testing different strategies for AVIF and WebP conversion.',
    startDate: '2024-03-20',
  },
];

const ExperimentPage: React.FC = () => {
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handleCreateExperiment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'New Image Test',
          variants: ['control', 'variant_a', 'variant_b'],
          traffic_percentage: 100,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create experiment');
      }

      const data = await response.json();
      setSelectedExperiment(data.experiment_id);
    } catch (error) {
      console.error('Error creating experiment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="experiment-page">
      <div className="header">
        <h1>A/B Testing Dashboard</h1>
        <button
          onClick={handleCreateExperiment}
          disabled={loading}
          className="create-button"
        >
          {loading ? 'Creating...' : 'Create New Experiment'}
        </button>
      </div>

      <div className="content">
        <div className="experiment-list">
          <h2>Active Experiments</h2>
          <div className="experiment-cards">
            {SAMPLE_EXPERIMENTS.map((experiment) => (
              <div
                key={experiment.id}
                className={`experiment-card ${
                  selectedExperiment === experiment.id ? 'selected' : ''
                }`}
                onClick={() => setSelectedExperiment(experiment.id)}
              >
                <h3>{experiment.name}</h3>
                <p className="description">{experiment.description}</p>
                <p className="date">Started: {experiment.startDate}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-container">
          {selectedExperiment ? (
            <ExperimentDashboard
              experimentId={selectedExperiment}
              onRefresh={() => setSelectedExperiment(selectedExperiment)}
            />
          ) : (
            <div className="no-selection">
              <p>Select an experiment to view results</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .experiment-page {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .create-button {
          padding: 10px 20px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .create-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .content {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 30px;
        }

        .experiment-list {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .experiment-cards {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 20px;
        }

        .experiment-card {
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .experiment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .experiment-card.selected {
          border-color: #4a90e2;
          background: #f8f9ff;
        }

        .experiment-card h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .description {
          font-size: 0.9rem;
          color: #666;
          margin: 0 0 10px 0;
        }

        .date {
          font-size: 0.8rem;
          color: #999;
          margin: 0;
        }

        .dashboard-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .no-selection {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
          color: #666;
          font-size: 1.2rem;
        }

        @media (max-width: 1200px) {
          .content {
            grid-template-columns: 1fr;
          }

          .experiment-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default ExperimentPage;
