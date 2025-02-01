from math import cos, radians, sin
from typing import Any, Dict

import numpy as np


def calculate_shot_metrics(
    power: float, angle: float, spin: float, english: float
) -> Dict[str, float]:
    """
    Calculate various metrics for a shot based on its parameters
    """
    # Convert angle to radians
    angle_rad = radians(angle)

    # Calculate velocity components
    velocity_x = power * cos(angle_rad)
    velocity_y = power * sin(angle_rad)

    # Calculate spin effects
    spin_factor = spin / 100  # Normalize spin to -1 to 1
    english_factor = english / 100  # Normalize english to -1 to 1

    # Calculate trajectory metrics
    max_height = (velocity_y**2) / (2 * 9.81)  # Maximum height of trajectory
    range_distance = (velocity_x * velocity_y) / 9.81  # Theoretical range

    # Adjust for spin effects
    spin_deflection = range_distance * spin_factor * 0.2
    english_deflection = range_distance * english_factor * 0.15

    # Calculate energy metrics
    kinetic_energy = 0.5 * power**2
    rotational_energy = 0.5 * (spin**2 + english**2)
    total_energy = kinetic_energy + rotational_energy

    # Calculate control metrics
    precision_factor = 1 - (abs(spin_factor) + abs(english_factor)) / 2
    control_rating = precision_factor * (1 - power / 100)

    return {
        "velocity": {"x": float(velocity_x), "y": float(velocity_y), "total": float(power)},
        "trajectory": {
            "max_height": float(max_height),
            "range": float(range_distance),
            "spin_deflection": float(spin_deflection),
            "english_deflection": float(english_deflection),
        },
        "energy": {
            "kinetic": float(kinetic_energy),
            "rotational": float(rotational_energy),
            "total": float(total_energy),
        },
        "control": {"precision": float(precision_factor), "control_rating": float(control_rating)},
    }


def validate_shot_data(data: Dict[str, Any]) -> bool:
    """
    Validate shot data parameters
    """
    required_fields = ["power", "angle"]
    for field in required_fields:
        if field not in data:
            raise ValueError(f"Missing required field: {field}")

    # Validate power range
    power = data.get("power", 0)
    if not 0 <= power <= 100:
        raise ValueError("Power must be between 0 and 100")

    # Validate angle range
    angle = data.get("angle", 0)
    if not -90 <= angle <= 90:
        raise ValueError("Angle must be between -90 and 90 degrees")

    # Validate spin range
    spin = data.get("spin", 0)
    if not -100 <= spin <= 100:
        raise ValueError("Spin must be between -100 and 100")

    # Validate english range
    english = data.get("english", 0)
    if not -100 <= english <= 100:
        raise ValueError("English must be between -100 and 100")

    return True


def calculate_shot_complexity(
    power: float, angle: float, spin: float, english: float, distance: float
) -> float:
    """
    Calculate the overall complexity of a shot
    """
    # Base complexity from power and distance
    base_complexity = (power / 100) * (distance / 100)

    # Angle complexity
    angle_complexity = abs(angle) / 90

    # Spin and english complexity
    spin_complexity = abs(spin) / 100
    english_complexity = abs(english) / 100

    # Weight factors for different components
    weights = {"base": 0.4, "angle": 0.2, "spin": 0.2, "english": 0.2}

    # Calculate weighted complexity
    complexity = (
        base_complexity * weights["base"]
        + angle_complexity * weights["angle"]
        + spin_complexity * weights["spin"]
        + english_complexity * weights["english"]
    )

    return min(1.0, complexity)


def analyze_shot_pattern(shots: list) -> Dict[str, Any]:
    """
    Analyze a sequence of shots to identify patterns
    """
    if not shots:
        return {"error": "No shots provided for analysis"}

    # Extract shot parameters
    powers = [shot.get("power", 0) for shot in shots]
    angles = [shot.get("angle", 0) for shot in shots]
    spins = [shot.get("spin", 0) for shot in shots]
    results = [shot.get("result", False) for shot in shots]

    # Calculate basic statistics
    stats = {
        "power": {
            "mean": float(np.mean(powers)),
            "std": float(np.std(powers)),
            "min": float(np.min(powers)),
            "max": float(np.max(powers)),
        },
        "angle": {
            "mean": float(np.mean(angles)),
            "std": float(np.std(angles)),
            "min": float(np.min(angles)),
            "max": float(np.max(angles)),
        },
        "spin": {
            "mean": float(np.mean(spins)),
            "std": float(np.std(spins)),
            "min": float(np.min(spins)),
            "max": float(np.max(spins)),
        },
    }

    # Calculate success rate
    success_rate = sum(results) / len(results)

    # Identify preferred power ranges
    power_ranges = {"low": (0, 33), "medium": (34, 66), "high": (67, 100)}

    power_distribution = {
        range_name: len([p for p in powers if range_val[0] <= p <= range_val[1]]) / len(powers)
        for range_name, range_val in power_ranges.items()
    }

    # Analyze consistency
    consistency = {
        "power": 1 - (stats["power"]["std"] / 100),
        "angle": 1 - (stats["angle"]["std"] / 90),
        "spin": 1 - (stats["spin"]["std"] / 100),
    }

    # Identify patterns
    patterns = []

    # Check for power consistency
    if consistency["power"] > 0.8:
        patterns.append("Consistent power application")
    elif consistency["power"] < 0.4:
        patterns.append("Highly variable power application")

    # Check for angle preferences
    if abs(stats["angle"]["mean"]) < 15:
        patterns.append("Prefers straight shots")
    elif stats["angle"]["mean"] > 30:
        patterns.append("Prefers right-angled shots")
    elif stats["angle"]["mean"] < -30:
        patterns.append("Prefers left-angled shots")

    # Check for spin usage
    if abs(stats["spin"]["mean"]) > 50:
        spin_direction = "right" if stats["spin"]["mean"] > 0 else "left"
        patterns.append(f"Heavy {spin_direction} spin preference")

    return {
        "statistics": stats,
        "success_rate": success_rate,
        "power_distribution": power_distribution,
        "consistency": consistency,
        "patterns": patterns,
    }


def calculate_player_rating(
    success_rate: float, shot_complexity: float, consistency: Dict[str, float]
) -> Dict[str, float]:
    """
    Calculate player rating based on performance metrics
    """
    # Base rating from success rate
    base_rating = success_rate * 50

    # Complexity bonus
    complexity_bonus = shot_complexity * 30

    # Consistency bonus
    consistency_avg = sum(consistency.values()) / len(consistency)
    consistency_bonus = consistency_avg * 20

    # Calculate total rating
    total_rating = base_rating + complexity_bonus + consistency_bonus

    # Calculate sub-ratings
    accuracy_rating = success_rate * 100
    technique_rating = (shot_complexity + consistency_avg) * 50
    consistency_rating = consistency_avg * 100

    return {
        "overall": min(100, total_rating),
        "accuracy": min(100, accuracy_rating),
        "technique": min(100, technique_rating),
        "consistency": min(100, consistency_rating),
    }
