# Computer Vision Module

The vision module provides real-time pool ball tracking and trajectory analysis capabilities for the DojoPool system.

## Components

### Ball Tracker

The `BallTracker` class is responsible for detecting and identifying pool balls in video frames:

```python
from dojopool.core.vision import BallTracker

# Initialize tracker
tracker = BallTracker(
    ball_diameter_mm=57.0,  # Standard pool ball diameter
    min_confidence=0.7      # Minimum detection confidence
)

# Detect balls in a frame
balls = tracker.detect_balls(frame)
```

Features:
- Ball detection using Hough circle transform
- Color-based ball identification
- Support for all 16 pool balls (including cue ball)
- Configurable detection parameters
- Optional table calibration for normalized coordinates

### Trajectory Tracker

The `TrajectoryTracker` class analyzes ball movements over time:

```python
from dojopool.core.vision import TrajectoryTracker

# Initialize tracker
tracker = TrajectoryTracker(
    max_history=30,           # Number of positions to track
    min_movement_threshold=2.0 # Minimum movement to detect
)

# Update trajectories
trajectories = tracker.update(balls, timestamp)

# Predict future positions
for trajectory in trajectories:
    if trajectory.is_moving:
        future_pos = tracker.predict_position(trajectory, time_delta=0.1)
```

Features:
- Ball movement tracking
- Velocity calculation
- Collision detection
- Position prediction
- Movement confidence scoring

## Example Usage

Here's a complete example of real-time ball tracking with trajectory analysis:

```python
import cv2
import time
from dojopool.core.vision import BallTracker, TrajectoryTracker

def main():
    # Initialize camera
    cap = cv2.VideoCapture(0)
    
    # Initialize trackers
    ball_tracker = BallTracker(ball_diameter_mm=40.0)
    trajectory_tracker = TrajectoryTracker()
    
    start_time = time.time()
    
    while True:
        # Get frame
        ret, frame = cap.read()
        if not ret:
            break
            
        # Get current time
        current_time = time.time() - start_time
        
        # Detect and track balls
        balls = ball_tracker.detect_balls(frame)
        trajectories = trajectory_tracker.update(balls, current_time)
        
        # Check for collisions
        collisions = trajectory_tracker.detect_collisions(
            trajectories, 
            ball_radius=20.0
        )
        
        # Draw visualizations...
        
        # Show frame
        cv2.imshow('Tracking', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    cap.release()
    cv2.destroyAllWindows()
```

## Installation

The vision module requires the following dependencies:
- OpenCV (cv2)
- NumPy
- Python 3.7+

Install via pip:
```bash
pip install -r requirements.txt
```

## Configuration

### Ball Tracker Parameters

- `ball_diameter_mm`: Physical diameter of pool balls (default: 57.0mm)
- `min_confidence`: Minimum confidence for ball detection (default: 0.7)
- `table_calibration`: Optional table calibration data for coordinate normalization

### Trajectory Tracker Parameters

- `max_history`: Maximum number of positions to track per ball (default: 30)
- `min_movement_threshold`: Minimum pixel distance to consider as movement (default: 2.0)
- `max_tracking_gap`: Maximum time gap to maintain tracking (default: 0.5s)

## Performance Considerations

- Frame resolution affects detection accuracy and performance
- Lighting conditions can impact color identification
- Processing time increases with number of balls tracked
- Consider using GPU acceleration for real-time tracking

## Contributing

When contributing to the vision module:
1. Add tests for new features
2. Document parameter choices and algorithms
3. Consider performance implications
4. Follow type hinting conventions
5. Update example code 