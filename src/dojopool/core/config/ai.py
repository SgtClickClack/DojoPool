"""AI configuration module.

This module provides configuration settings for AI services.
"""

import os

# Model paths
AI_CONFIG = {
    "POSE_MODEL_PATH": os.path.join("models", "pose_estimation.h5"),
    "SHOT_MODEL_PATH": os.path.join("models", "shot_prediction.h5"),
    "NARRATIVE_MODEL_PATH": os.path.join("models", "narrative_generation.h5"),
    "STYLE_MODEL_PATH": os.path.join("models", "style_transfer.h5"),
    # Model parameters
    "POSE_INPUT_SIZE": (224, 224),
    "SHOT_SEQUENCE_LENGTH": 30,
    "NARRATIVE_MAX_LENGTH": 500,
    "STYLE_IMAGE_SIZE": (256, 256),
    # Training parameters
    "BATCH_SIZE": 32,
    "LEARNING_RATE": 0.001,
    "NUM_EPOCHS": 100,
    # Inference parameters
    "POSE_CONFIDENCE_THRESHOLD": 0.5,
    "SHOT_PROBABILITY_THRESHOLD": 0.7,
    "BALL_DETECTION_THRESHOLD": 0.8,
    # Feature extraction
    "NUM_POSE_KEYPOINTS": 17,
    "FEATURE_VECTOR_SIZE": 128,
    # Cache settings
    "CACHE_TIMEOUT": 3600,  # 1 hour
    "MAX_CACHE_SIZE": 1000,  # Maximum number of cached items
    # API settings
    "API_TIMEOUT": 30,  # seconds
    "MAX_RETRIES": 3,
    "RETRY_DELAY": 1,  # seconds
    # Performance settings
    "USE_GPU": True,
    "NUM_THREADS": 4,
    "BATCH_PROCESSING": True,
    # Logging
    "LOG_PREDICTIONS": True,
    "LOG_LEVEL": "INFO",
    # Development settings
    "DEBUG_MODE": os.getenv("FLASK_ENV") == "development",
    "USE_MOCK_MODELS": os.getenv("USE_MOCK_MODELS", "false").lower() == "true",
}

# Model-specific configurations
POSE_CONFIG = {
    "keypoint_names": [
        "nose",
        "neck",
        "right_shoulder",
        "right_elbow",
        "right_wrist",
        "left_shoulder",
        "left_elbow",
        "left_wrist",
        "right_hip",
        "right_knee",
        "right_ankle",
        "left_hip",
        "left_knee",
        "left_ankle",
        "right_eye",
        "left_eye",
        "right_ear",
        "left_ear",
    ],
    "connected_keypoints": [
        ("right_shoulder", "right_elbow"),
        ("right_elbow", "right_wrist"),
        ("left_shoulder", "left_elbow"),
        ("left_elbow", "left_wrist"),
        ("right_shoulder", "left_shoulder"),
        ("right_hip", "left_hip"),
        ("right_shoulder", "right_hip"),
        ("left_shoulder", "left_hip"),
        ("right_hip", "right_knee"),
        ("right_knee", "right_ankle"),
        ("left_hip", "left_knee"),
        ("left_knee", "left_ankle"),
    ],
}

SHOT_CONFIG = {
    "shot_types": [
        "straight",
        "draw",
        "follow",
        "stop",
        "stun",
        "masse",
        "jump",
        "bank",
        "combination",
    ],
    "difficulty_levels": ["beginner", "intermediate", "advanced", "expert", "professional"],
    "analysis_metrics": ["accuracy", "power_control", "spin_control", "consistency", "technique"],
}

NARRATIVE_CONFIG = {
    "story_elements": ["setup", "challenge", "action", "outcome", "reflection"],
    "tone_options": ["encouraging", "instructive", "motivational", "analytical", "celebratory"],
    "length_options": {"short": 100, "medium": 250, "long": 500},
}

STYLE_CONFIG = {
    "style_presets": ["classic", "modern", "artistic", "professional", "casual"],
    "color_schemes": {
        "classic": ["#2C3E50", "#E74C3C", "#ECF0F1"],
        "modern": ["#2196F3", "#FFC107", "#4CAF50"],
        "artistic": ["#9C27B0", "#FF4081", "#00BCD4"],
        "professional": ["#212121", "#757575", "#BDBDBD"],
        "casual": ["#FF9800", "#CDDC39", "#03A9F4"],
    },
}

# Development overrides
if AI_CONFIG["DEBUG_MODE"]:
    AI_CONFIG.update(
        {
            "CACHE_TIMEOUT": 60,  # 1 minute
            "LOG_LEVEL": "DEBUG",
            "USE_GPU": False,
            "BATCH_PROCESSING": False,
        }
    )
