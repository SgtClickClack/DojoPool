"""Shot analysis service with advanced AI capabilities."""
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from scipy.spatial import distance
import mediapipe as mp
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from src.extensions import cache
from src.core.config import AI_CONFIG

@dataclass
class PoseKeypoints:
    """Represents detected pose keypoints."""
    shoulders: Tuple[float, float]
    elbow: Tuple[float, float]
    wrist: Tuple[float, float]
    hip: Tuple[float, float]
    knee: Tuple[float, float]
    ankle: Tuple[float, float]
    confidence: float

@dataclass
class ShotMetrics:
    """Represents shot analysis metrics."""
    power: float
    accuracy: float
    spin: float
    difficulty: float
    form_score: float
    consistency: float

class ShotAnalyzer:
    """Advanced AI shot analyzer."""
    
    def __init__(self):
        """Initialize shot analyzer with advanced models."""
        # Load pre-trained models
        self.pose_model = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.shot_classifier = load_model(AI_CONFIG['SHOT_MODEL_PATH'])
        self.difficulty_estimator = load_model(AI_CONFIG['DIFFICULTY_MODEL_PATH'])
        self.spin_detector = load_model(AI_CONFIG['SPIN_MODEL_PATH'])
        
        # Initialize video processing
        self.ball_detector = cv2.createBackgroundSubtractorMOG2(
            history=100,
            varThreshold=40,
            detectShadows=False
        )
        
        # Initialize feature extractors
        self.feature_extractor = MobileNetV2(
            weights='imagenet',
            include_top=False,
            pooling='avg'
        )
        
        # Load calibration data
        self.power_scaler = tf.keras.models.load_model(AI_CONFIG['POWER_CALIBRATION_PATH'])
        self.accuracy_scaler = tf.keras.models.load_model(AI_CONFIG['ACCURACY_CALIBRATION_PATH'])
        
    def analyze_shot(self, video_path: str, real_time: bool = False) -> Dict:
        """Analyze a shot with advanced metrics.
        
        Args:
            video_path: Path to video file
            real_time: Whether to provide real-time feedback
            
        Returns:
            dict: Comprehensive shot analysis
        """
        # Try to get from cache if not real-time
        if not real_time:
            cache_key = f'shot_analysis:{video_path}'
            cached = cache.get(cache_key)
            if cached:
                return cached
        
        # Extract and preprocess frames
        frames = self._extract_frames(video_path)
        if not frames:
            return {'error': 'Failed to extract video frames'}
        
        # Analyze pose sequence
        pose_sequence = self._analyze_pose_sequence(frames)
        
        # Track ball movement with improved accuracy
        ball_trajectory = self._track_ball_advanced(frames)
        
        # Calculate shot metrics
        metrics = self._calculate_shot_metrics(pose_sequence, ball_trajectory)
        
        # Estimate shot difficulty
        difficulty = self._estimate_shot_difficulty(
            pose_sequence,
            ball_trajectory,
            metrics
        )
        
        # Generate detailed feedback
        feedback = self._generate_detailed_feedback(
            pose_sequence,
            ball_trajectory,
            metrics,
            difficulty
        )
        
        # Compile comprehensive results
        results = {
            'metrics': {
                'power': metrics.power,
                'accuracy': metrics.accuracy,
                'spin': metrics.spin,
                'difficulty': difficulty,
                'form_score': metrics.form_score,
                'consistency': metrics.consistency
            },
            'pose_analysis': {
                'stance_score': self._analyze_stance(pose_sequence),
                'bridge_score': self._analyze_bridge(pose_sequence),
                'stroke_score': self._analyze_stroke(pose_sequence),
                'follow_through': self._analyze_follow_through(pose_sequence)
            },
            'ball_analysis': {
                'trajectory': ball_trajectory,
                'spin_characteristics': self._analyze_spin_characteristics(ball_trajectory),
                'power_curve': self._analyze_power_curve(ball_trajectory)
            },
            'feedback': feedback,
            'training_recommendations': self._generate_training_recommendations(
                metrics,
                difficulty,
                feedback
            )
        }
        
        # Cache results if not real-time
        if not real_time:
            cache.set(cache_key, results, timeout=3600)
        
        return results
    
    def _extract_frames(self, video_path: str, sample_rate: int = 5) -> Optional[np.ndarray]:
        """Extract and preprocess video frames with advanced techniques."""
        frames = []
        cap = cv2.VideoCapture(video_path)
        
        try:
            frame_count = 0
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % sample_rate == 0:
                    # Advanced preprocessing
                    frame = cv2.resize(frame, (224, 224))
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frame = self._enhance_frame(frame)
                    frames.append(frame)
                
                frame_count += 1
                
        finally:
            cap.release()
        
        return np.array(frames) if frames else None
    
    def _enhance_frame(self, frame: np.ndarray) -> np.ndarray:
        """Apply advanced frame enhancement techniques."""
        # Denoise
        frame = cv2.fastNlMeansDenoisingColored(frame, None, 10, 10, 7, 21)
        
        # Enhance contrast
        lab = cv2.cvtColor(frame, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        l = clahe.apply(l)
        lab = cv2.merge((l,a,b))
        frame = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
        
        return frame
    
    def _analyze_pose_sequence(self, frames: np.ndarray) -> List[PoseKeypoints]:
        """Analyze pose sequence using MediaPipe."""
        pose_sequence = []
        
        for frame in frames:
            results = self.pose_model.process(frame)
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                keypoints = PoseKeypoints(
                    shoulders=(
                        (landmarks[11].x + landmarks[12].x) / 2,
                        (landmarks[11].y + landmarks[12].y) / 2
                    ),
                    elbow=(landmarks[13].x, landmarks[13].y),
                    wrist=(landmarks[15].x, landmarks[15].y),
                    hip=(
                        (landmarks[23].x + landmarks[24].x) / 2,
                        (landmarks[23].y + landmarks[24].y) / 2
                    ),
                    knee=(landmarks[25].x, landmarks[25].y),
                    ankle=(landmarks[27].x, landmarks[27].y),
                    confidence=np.mean([
                        landmarks[11].visibility,
                        landmarks[12].visibility,
                        landmarks[13].visibility,
                        landmarks[15].visibility,
                        landmarks[23].visibility,
                        landmarks[24].visibility,
                        landmarks[25].visibility,
                        landmarks[27].visibility
                    ])
                )
                pose_sequence.append(keypoints)
            else:
                pose_sequence.append(None)
        
        return pose_sequence
    
    def _track_ball_advanced(self, frames: np.ndarray) -> List[Dict]:
        """Advanced ball tracking with multiple features."""
        trajectory = []
        prev_position = None
        
        for frame in frames:
            # Apply background subtraction
            fg_mask = self.ball_detector.apply(frame)
            
            # Enhance mask
            fg_mask = cv2.morphologyEx(
                fg_mask,
                cv2.MORPH_OPEN,
                cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
            )
            
            # Find contours
            contours, _ = cv2.findContours(
                fg_mask,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            # Find ball contour using multiple features
            ball_contour = None
            max_score = 0
            
            for contour in contours:
                # Calculate circularity
                area = cv2.contourArea(contour)
                perimeter = cv2.arcLength(contour, True)
                circularity = 4 * np.pi * area / (perimeter * perimeter) if perimeter > 0 else 0
                
                # Calculate aspect ratio
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = float(w)/h if h > 0 else 0
                
                # Calculate convexity
                hull = cv2.convexHull(contour)
                hull_area = cv2.contourArea(hull)
                solidity = float(area)/hull_area if hull_area > 0 else 0
                
                # Calculate position consistency
                position_score = 1.0
                if prev_position:
                    dist = np.sqrt((x + w/2 - prev_position[0])**2 + (y + h/2 - prev_position[1])**2)
                    position_score = np.exp(-dist / 100)  # Decay factor
                
                # Combined score
                score = (
                    0.3 * (1 - abs(circularity - 1)) +  # Perfect circle has circularity = 1
                    0.2 * (1 - abs(aspect_ratio - 1)) +  # Perfect circle has aspect ratio = 1
                    0.2 * solidity +                     # Higher solidity is better
                    0.3 * position_score                 # Position consistency
                )
                
                if score > max_score and area > 100:  # Minimum area threshold
                    ball_contour = contour
                    max_score = score
            
            if ball_contour is not None:
                # Get ball center and characteristics
                M = cv2.moments(ball_contour)
                if M['m00'] != 0:
                    cx = int(M['m10'] / M['m00'])
                    cy = int(M['m01'] / M['m00'])
                    
                    # Calculate rotation using image gradients
                    roi = frame[max(0, cy-20):min(frame.shape[0], cy+20),
                              max(0, cx-20):min(frame.shape[1], cx+20)]
                    if roi.size > 0:
                        gray_roi = cv2.cvtColor(roi, cv2.COLOR_RGB2GRAY)
                        gx = cv2.Sobel(gray_roi, cv2.CV_32F, 1, 0)
                        gy = cv2.Sobel(gray_roi, cv2.CV_32F, 0, 1)
                        rotation = np.arctan2(np.mean(gy), np.mean(gx))
                    else:
                        rotation = 0
                    
                    trajectory.append({
                        'position': (cx, cy),
                        'velocity': self._calculate_velocity(prev_position, (cx, cy)) if prev_position else 0,
                        'rotation': rotation,
                        'confidence': max_score
                    })
                    
                    prev_position = (cx, cy)
            else:
                trajectory.append(None)
                prev_position = None
        
        return trajectory
    
    def _calculate_shot_metrics(
        self,
        pose_sequence: List[PoseKeypoints],
        ball_trajectory: List[Dict]
    ) -> ShotMetrics:
        """Calculate comprehensive shot metrics."""
        # Calculate power
        velocities = [p['velocity'] for p in ball_trajectory if p is not None]
        power = np.max(velocities) if velocities else 0
        power = self.power_scaler.predict(np.array([[power]]))[0][0]
        
        # Calculate accuracy
        accuracy = self._calculate_accuracy(ball_trajectory)
        accuracy = self.accuracy_scaler.predict(np.array([[accuracy]]))[0][0]
        
        # Calculate spin
        spin_features = self._extract_spin_features(ball_trajectory)
        spin = self.spin_detector.predict(spin_features)[0][0]
        
        # Calculate form score
        form_scores = []
        for pose in pose_sequence:
            if pose and pose.confidence > 0.7:
                form_scores.append(self._calculate_form_score(pose))
        form_score = np.mean(form_scores) if form_scores else 0
        
        # Calculate consistency
        consistency = self._calculate_consistency(pose_sequence, ball_trajectory)
        
        return ShotMetrics(
            power=power,
            accuracy=accuracy,
            spin=spin,
            difficulty=0.0,  # Will be calculated separately
            form_score=form_score,
            consistency=consistency
        )
    
    def _estimate_shot_difficulty(
        self,
        pose_sequence: List[PoseKeypoints],
        ball_trajectory: List[Dict],
        metrics: ShotMetrics
    ) -> float:
        """Estimate shot difficulty using multiple factors."""
        # Extract features for difficulty estimation
        features = []
        
        # Trajectory complexity
        if ball_trajectory:
            positions = [(t['position'][0], t['position'][1]) 
                        for t in ball_trajectory if t is not None]
            if len(positions) >= 2:
                # Calculate path complexity
                path_length = sum(
                    distance.euclidean(positions[i], positions[i+1])
                    for i in range(len(positions)-1)
                )
                direct_distance = distance.euclidean(positions[0], positions[-1])
                complexity = path_length / direct_distance if direct_distance > 0 else 1
                features.append(complexity)
                
                # Calculate curvature
                if len(positions) >= 3:
                    curvature = self._calculate_curvature(positions)
                    features.append(curvature)
                else:
                    features.append(0)
            else:
                features.extend([1, 0])  # Default values
        else:
            features.extend([1, 0])  # Default values
        
        # Add shot metrics
        features.extend([
            metrics.power,
            metrics.spin,
            1 - metrics.accuracy  # Higher difficulty for lower accuracy
        ])
        
        # Predict difficulty
        difficulty = self.difficulty_estimator.predict(
            np.array(features).reshape(1, -1)
        )[0][0]
        
        return difficulty
    
    def _calculate_curvature(self, points: List[Tuple[float, float]]) -> float:
        """Calculate the average curvature of a path."""
        if len(points) < 3:
            return 0
            
        curvature = 0
        for i in range(1, len(points)-1):
            x1, y1 = points[i-1]
            x2, y2 = points[i]
            x3, y3 = points[i+1]
            
            # Calculate curvature using three points
            a = distance.euclidean((x1, y1), (x2, y2))
            b = distance.euclidean((x2, y2), (x3, y3))
            c = distance.euclidean((x1, y1), (x3, y3))
            
            if a * b * c == 0:
                continue
                
            # Calculate angle using law of cosines
            angle = np.arccos(
                (a*a + b*b - c*c) / (2*a*b)
            )
            
            curvature += angle
            
        return curvature / (len(points)-2)
    
    def _calculate_form_score(self, pose: PoseKeypoints) -> float:
        """Calculate form score based on pose alignment."""
        # Calculate key angles
        shoulder_angle = self._calculate_angle(
            pose.hip,
            pose.shoulders,
            pose.elbow
        )
        
        elbow_angle = self._calculate_angle(
            pose.shoulders,
            pose.elbow,
            pose.wrist
        )
        
        # Calculate stance width
        stance_width = distance.euclidean(
            pose.hip,
            pose.knee
        )
        
        # Define ideal values
        ideal_shoulder_angle = 90  # degrees
        ideal_elbow_angle = 45    # degrees
        ideal_stance_width = 0.4   # relative to height
        
        # Calculate deviations
        shoulder_score = 1 - min(abs(shoulder_angle - ideal_shoulder_angle) / 90, 1)
        elbow_score = 1 - min(abs(elbow_angle - ideal_elbow_angle) / 45, 1)
        stance_score = 1 - min(abs(stance_width - ideal_stance_width) / 0.4, 1)
        
        # Weighted average
        return 0.4 * shoulder_score + 0.4 * elbow_score + 0.2 * stance_score
    
    def _calculate_angle(
        self,
        p1: Tuple[float, float],
        p2: Tuple[float, float],
        p3: Tuple[float, float]
    ) -> float:
        """Calculate angle between three points in degrees."""
        a = np.array(p1)
        b = np.array(p2)
        c = np.array(p3)
        
        ba = a - b
        bc = c - b
        
        cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
        angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
        
        return np.degrees(angle)
    
    def _calculate_consistency(
        self,
        pose_sequence: List[PoseKeypoints],
        ball_trajectory: List[Dict]
    ) -> float:
        """Calculate shot consistency score."""
        # Calculate pose stability
        pose_stability = self._calculate_pose_stability(pose_sequence)
        
        # Calculate trajectory smoothness
        trajectory_smoothness = self._calculate_trajectory_smoothness(ball_trajectory)
        
        # Weighted combination
        return 0.6 * pose_stability + 0.4 * trajectory_smoothness
    
    def _calculate_pose_stability(self, pose_sequence: List[PoseKeypoints]) -> float:
        """Calculate stability of pose during shot."""
        if not pose_sequence:
            return 0
            
        # Calculate variance of key points
        variances = []
        for i in range(len(pose_sequence[0].__dict__) - 1):  # Exclude confidence
            points = [
                getattr(pose, list(pose.__dict__.keys())[i])
                for pose in pose_sequence
                if pose is not None
            ]
            if points:
                variance = np.var([p[0] for p in points]) + np.var([p[1] for p in points])
                variances.append(variance)
        
        if not variances:
            return 0
            
        # Convert variance to stability score (lower variance = higher stability)
        avg_variance = np.mean(variances)
        stability = 1 / (1 + avg_variance)  # Sigmoid-like normalization
        
        return stability
    
    def _calculate_trajectory_smoothness(self, trajectory: List[Dict]) -> float:
        """Calculate smoothness of ball trajectory."""
        if not trajectory:
            return 0
            
        # Calculate acceleration changes
        velocities = [t['velocity'] for t in trajectory if t is not None]
        if len(velocities) < 3:
            return 0
            
        accelerations = np.diff(velocities)
        jerk = np.diff(accelerations)
        
        # Calculate smoothness (lower jerk = higher smoothness)
        avg_jerk = np.mean(np.abs(jerk))
        smoothness = 1 / (1 + avg_jerk)  # Sigmoid-like normalization
        
        return smoothness
    
    def _generate_detailed_feedback(
        self,
        pose_sequence: List[PoseKeypoints],
        ball_trajectory: List[Dict],
        metrics: ShotMetrics,
        difficulty: float
    ) -> Dict:
        """Generate detailed feedback and recommendations."""
        feedback = {
            'strengths': [],
            'weaknesses': [],
            'technical_analysis': {},
            'improvement_areas': []
        }
        
        # Analyze strengths and weaknesses
        if metrics.power > 0.7:
            feedback['strengths'].append("Excellent power generation")
        elif metrics.power < 0.4:
            feedback['weaknesses'].append("Power generation needs improvement")
            
        if metrics.accuracy > 0.8:
            feedback['strengths'].append("High accuracy and control")
        elif metrics.accuracy < 0.5:
            feedback['weaknesses'].append("Work on shot accuracy")
            
        if metrics.form_score > 0.75:
            feedback['strengths'].append("Good form and technique")
        elif metrics.form_score < 0.5:
            feedback['weaknesses'].append("Form needs refinement")
            
        # Technical analysis
        feedback['technical_analysis'] = {
            'stance': self._analyze_stance(pose_sequence),
            'bridge': self._analyze_bridge(pose_sequence),
            'stroke': self._analyze_stroke(pose_sequence),
            'follow_through': self._analyze_follow_through(pose_sequence),
            'ball_control': self._analyze_ball_control(ball_trajectory)
        }
        
        # Generate specific improvement areas
        feedback['improvement_areas'] = self._identify_improvement_areas(
            metrics,
            difficulty,
            feedback['technical_analysis']
        )
        
        return feedback
    
    def _generate_training_recommendations(
        self,
        metrics: ShotMetrics,
        difficulty: float,
        feedback: Dict
    ) -> List[Dict]:
        """Generate personalized training recommendations."""
        recommendations = []
        
        # Power training
        if metrics.power < 0.6:
            recommendations.append({
                'aspect': 'Power',
                'exercises': [
                    'Bridge strength training',
                    'Follow-through drills',
                    'Power control exercises'
                ],
                'drills': [
                    'Long straight shots',
                    'Break shot practice',
                    'Power draw shots'
                ]
            })
        
        # Accuracy training
        if metrics.accuracy < 0.7:
            recommendations.append({
                'aspect': 'Accuracy',
                'exercises': [
                    'Alignment drills',
                    'Stance stability exercises',
                    'Precision shooting practice'
                ],
                'drills': [
                    'Spot shot practice',
                    'Cut shot angles',
                    'Position play drills'
                ]
            })
        
        # Form improvement
        if metrics.form_score < 0.65:
            recommendations.append({
                'aspect': 'Form',
                'exercises': [
                    'Mirror practice',
                    'Slow motion drills',
                    'Video analysis sessions'
                ],
                'drills': [
                    'Basic stroke practice',
                    'Bridge hand stability',
                    'Follow-through consistency'
                ]
            })
        
        # Consistency training
        if metrics.consistency < 0.7:
            recommendations.append({
                'aspect': 'Consistency',
                'exercises': [
                    'Repetition drills',
                    'Pressure situation practice',
                    'Focus exercises'
                ],
                'drills': [
                    'Same shot multiple times',
                    'Pattern practice',
                    'Progressive difficulty drills'
                ]
            })
        
        return recommendations
