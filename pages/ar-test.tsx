import React, { useCallback, useRef, useState } from 'react';
import {
  analyzeTableImage,
  type ARAnalysisResult,
  type Ball,
} from '../src/frontend/api/arApi';

const ARTestPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ARAnalysisResult | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Please select an image smaller than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeTableImage(selectedFile);
      setAnalysisResult(result);
      drawVisualization(result);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile]);

  const drawVisualization = useCallback(
    (result: ARAnalysisResult) => {
      const canvas = canvasRef.current;
      if (!canvas || !previewUrl) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Draw table bounds
        if (result.tableBounds && result.tableBounds.corners) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 3;
          ctx.beginPath();

          const corners = result.tableBounds.corners;
          if (corners.length > 0) {
            ctx.moveTo(corners[0].x, corners[0].y);
            for (let i = 1; i < corners.length; i++) {
              ctx.lineTo(corners[i].x, corners[i].y);
            }
            ctx.closePath();
            ctx.stroke();
          }
        }

        // Draw balls
        if (result.balls && result.balls.length > 0) {
          result.balls.forEach((ball: Ball) => {
            const { position, type } = ball;

            // Ball radius (adjust as needed)
            const radius = 12;

            // Set color based on ball type
            switch (type) {
              case 'cue':
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                break;
              case 'eight':
                ctx.fillStyle = '#000000';
                ctx.strokeStyle = '#ffffff';
                break;
              case 'solid':
                ctx.fillStyle = '#ff4444';
                ctx.strokeStyle = '#ffffff';
                break;
              case 'stripe':
                ctx.fillStyle = '#4444ff';
                ctx.strokeStyle = '#ffffff';
                break;
              default:
                ctx.fillStyle = '#888888';
                ctx.strokeStyle = '#ffffff';
            }

            ctx.lineWidth = 2;

            // Draw ball
            ctx.beginPath();
            ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();

            // Draw ball type label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(type, position.x, position.y + radius + 15);
          });
        }

        // Draw confidence score
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(
          `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
          10,
          30
        );
      };
      img.src = previewUrl;
    },
    [previewUrl]
  );

  const resetAnalysis = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>AR Coach Testing UI</h1>
      <p>Upload a pool table image to test the AR analysis functionality.</p>

      {/* File Upload Section */}
      <div style={{ marginBottom: '20px' }}>
        <label
          htmlFor="image-upload"
          style={{ display: 'block', marginBottom: '10px' }}
        >
          Select Pool Table Image:
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ marginBottom: '10px' }}
        />
        <br />
        <button
          onClick={handleAnalyze}
          disabled={!selectedFile || isAnalyzing}
          style={{
            padding: '10px 20px',
            backgroundColor: selectedFile && !isAnalyzing ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: selectedFile && !isAnalyzing ? 'pointer' : 'not-allowed',
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Table'}
        </button>
        <button
          onClick={resetAnalysis}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginLeft: '10px',
          }}
        >
          Reset
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Canvas Visualization */}
      <div style={{ marginBottom: '20px' }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div style={{ marginTop: '20px' }}>
          <h3>Analysis Results:</h3>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '5px',
              fontFamily: 'monospace',
            }}
          >
            <p>
              <strong>Confidence:</strong>{' '}
              {(analysisResult.confidence * 100).toFixed(1)}%
            </p>
            <p>
              <strong>Balls Detected:</strong>{' '}
              {analysisResult.balls?.length || 0}
            </p>
            <p>
              <strong>Table Bounds:</strong>{' '}
              {analysisResult.tableBounds ? 'Detected' : 'Not Detected'}
            </p>
            <p>
              <strong>Timestamp:</strong>{' '}
              {new Date(analysisResult.timestamp).toLocaleString()}
            </p>

            {analysisResult.balls && analysisResult.balls.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <strong>Ball Details:</strong>
                <ul>
                  {analysisResult.balls.map((ball, index) => (
                    <li key={index}>
                      {ball.type} ball at ({ball.position.x.toFixed(1)},{' '}
                      {ball.position.y.toFixed(1)}) - Confidence:{' '}
                      {(ball.confidence * 100).toFixed(1)}%
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px',
        }}
      >
        <h4>Instructions:</h4>
        <ul>
          <li>Select a clear image of a pool table</li>
          <li>Click "Analyze Table" to process the image</li>
          <li>
            The system will detect table boundaries (green outline) and balls
          </li>
          <li>
            White balls = cue balls, Black = 8-ball, Red = solids, Blue =
            stripes
          </li>
          <li>Results will be overlaid on the original image</li>
        </ul>
      </div>
    </div>
  );
};

export default ARTestPage;
