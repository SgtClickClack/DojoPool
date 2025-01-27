export interface KalmanState {
    x: number;  // State (position)
    v: number;  // Velocity
    P: [number, number, number, number];  // Covariance matrix
}

export interface KalmanConfig {
    Q: number;  // Process noise
    R: number;  // Measurement noise
    dt: number; // Time step
}

export interface KalmanPrediction {
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    uncertainty: { x: number; y: number };
} 