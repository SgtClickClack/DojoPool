import React, { useEffect, useState } from "react";
import { OptimizationEngine } from "../utils/optimizationEngine";

interface OptimizationPanelProps {
  playerId: string;
  metrics: {
    recentAccuracy: number;
    averageDifficulty: number;
    consistencyScore: number;
  };
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  playerId,
  metrics,
}) => {
  const [suggestions, setSuggestions] = useState<
    Array<{
      type: "technique" | "strategy" | "practice";
      priority: number;
      title: string;
      description: string;
    }>
  >([]);

  const [drills, setDrills] = useState<
    Array<{
      drillType: string;
      difficulty: number;
      repetitions: number;
    }>
  >([]);

  useEffect(() => {
    const loadOptimizations = async () => {
      const engine = OptimizationEngine.getInstance();

      try {
        const newSuggestions = await engine.generateSuggestions(
          playerId,
          metrics,
        );
        setSuggestions(newSuggestions);

        const newDrills = await engine.generateDrills(playerId, metrics);
        setDrills(newDrills);
      } catch (error) {
        console.error("Failed to load optimizations:", error);
      }
    };

    loadOptimizations();
  }, [playerId, metrics]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "technique":
        return "#8884d8";
      case "strategy":
        return "#82ca9d";
      case "practice":
        return "#ffc658";
      default:
        return "#666";
    }
  };

  return (
    <div className="optimization-panel">
      <style jsx>{`
        .optimization-panel {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .section-title {
          color: #333;
          font-size: 1.2em;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #eee;
        }

        .suggestions-list {
          margin-bottom: 20px;
        }

        .suggestion-item {
          background: white;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 6px;
          border-left: 4px solid;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .suggestion-title {
          font-weight: 600;
          color: #333;
        }

        .suggestion-type {
          font-size: 0.8em;
          padding: 4px 8px;
          border-radius: 12px;
          color: white;
        }

        .suggestion-description {
          color: #666;
          font-size: 0.9em;
        }

        .drills-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
        }

        .drill-item {
          background: white;
          padding: 15px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .drill-type {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .drill-details {
          font-size: 0.9em;
          color: #666;
        }

        .drill-stat {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
      `}</style>

      <div className="suggestions-list">
        <h3 className="section-title">Improvement Suggestions</h3>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="suggestion-item"
            style={{ borderLeftColor: getTypeColor(suggestion.type) }}
          >
            <div className="suggestion-header">
              <div className="suggestion-title">{suggestion.title}</div>
              <div
                className="suggestion-type"
                style={{ backgroundColor: getTypeColor(suggestion.type) }}
              >
                {suggestion.type.charAt(0).toUpperCase() +
                  suggestion.type.slice(1)}
              </div>
            </div>
            <div className="suggestion-description">
              {suggestion.description}
            </div>
          </div>
        ))}
      </div>

      <div className="drills-section">
        <h3 className="section-title">Recommended Drills</h3>
        <div className="drills-list">
          {drills.map((drill, index) => (
            <div key={index} className="drill-item">
              <div className="drill-type">{drill.drillType}</div>
              <div className="drill-details">
                <div className="drill-stat">
                  <span>Difficulty:</span>
                  <span>{(drill.difficulty * 100).toFixed(0)}%</span>
                </div>
                <div className="drill-stat">
                  <span>Repetitions:</span>
                  <span>{drill.repetitions}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
