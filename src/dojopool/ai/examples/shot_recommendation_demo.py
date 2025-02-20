"""Demo script for the DojoPool AI Shot Recommendation System."""

import argparse
import time
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np

from dojopool.ai.computer_vision import TableStateAnalyzer
from dojopool.ai.shot_physics import Ball, Vector2D
from dojopool.ai.shot_recommendation import (
    ShotDifficulty,
    ShotRecommendation,
    ShotRecommender,
    ShotType,
)


def create_sample_image(width: int = 1920, height: int = 1080) -> np.ndarray:
    """Create a sample pool table image for testing."""
    # Create green background (pool table)
    image = np.zeros((height, width, 3), dtype=np.uint8)
    image[:, :] = [0, 100, 0]  # BGR green

    # Add table rails (brown)
    rail_color = (30, 60, 90)  # BGR brown
    rail_width = 50
    cv2.rectangle(
        image,
        (rail_width, rail_width),
        (width - rail_width, height - rail_width),
        rail_color,
        rail_width,
    )

    # Add pockets (black circles)
    pocket_radius = 30
    pocket_color = (0, 0, 0)  # BGR black
    pocket_positions = [
        (rail_width, rail_width),  # Top left
        (width // 2, rail_width),  # Top center
        (width - rail_width, rail_width),  # Top right
        (rail_width, height - rail_width),  # Bottom left
        (width // 2, height - rail_width),  # Bottom center
        (width - rail_width, height - rail_width),  # Bottom right
    ]

    for pos in pocket_positions:
        cv2.circle(image, pos, pocket_radius, pocket_color, -1)

    # Add some balls
    ball_radius = 15
    balls = [
        ((width // 4, height // 2), (255, 255, 255)),  # Cue ball (white)
        ((width // 2, height // 2), (255, 255, 0)),  # 1 ball (yellow)
        ((3 * width // 4, height // 2), (0, 0, 255)),  # 3 ball (red)
        ((width // 2, height // 4), (0, 255, 0)),  # 6 ball (green)
        ((width // 2, 3 * height // 4), (0, 0, 0)),  # 8 ball (black)
    ]

    for pos, color in balls:
        cv2.circle(image, pos, ball_radius, color, -1)
        # Add highlight
        highlight_pos = (pos[0] - ball_radius // 3, pos[1] - ball_radius // 3)
        cv2.circle(image, highlight_pos, ball_radius // 4, (255, 255, 255), -1)

    return image


def draw_shot_recommendation(image: np.ndarray, shot: ShotRecommendation) -> np.ndarray:
    """Draw shot recommendation visualization on the image."""
    # Create a copy of the image
    viz = image.copy()

    # Draw line from cue ball to object ball
    start = (
        int(shot.cue_ball_position.x * image.shape[1] / 100),
        int(shot.cue_ball_position.y * image.shape[0] / 100),
    )
    mid = (
        int(shot.object_ball_position.x * image.shape[1] / 100),
        int(shot.object_ball_position.y * image.shape[0] / 100),
    )
    end = (
        int(shot.target_pocket[0] * image.shape[1] / 100),
        int(shot.target_pocket[1] * image.shape[0] / 100),
    )

    # Draw shot path
    cv2.line(viz, start, mid, (0, 255, 255), 2)  # Yellow line to object ball
    cv2.line(viz, mid, end, (0, 255, 0), 2)  # Green line to pocket

    # Draw aiming point
    cv2.circle(viz, mid, 5, (0, 0, 255), -1)

    # Add shot information
    info_text = [
        f"Type: {shot.shot_type.value}",
        f"Difficulty: {shot.difficulty.value}",
        f"Success: {shot.success_probability:.1%}",
    ]

    for i, text in enumerate(info_text):
        cv2.putText(
            viz,
            text,
            (10, 30 + i * 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            2,
        )

    return viz


def main():
    """Run the shot recommendation demo."""
    parser = argparse.ArgumentParser(description="DojoPool Shot Recommendation Demo")
    parser.add_argument(
        "--input",
        type=str,
        help="Path to input image (uses sample image if not provided)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="shot_recommendation.jpg",
        help="Path to output visualization",
    )
    parser.add_argument(
        "--player-id",
        type=str,
        default="demo_player",
        help="Player ID for recommendations",
    )
    args = parser.parse_args()

    # Load or create image
    if args.input:
        image = cv2.imread(args.input)
        if image is None:
            print(f"Error: Could not load image {args.input}")
            return
    else:
        print("Using sample image...")
        image = create_sample_image()

    # Initialize components
    recommender = ShotRecommender()

    # Get recommendations
    print("Analyzing shot options...")
    start_time = time.time()

    recommendations = recommender.get_recommendations(
        image=image,
        player_id=args.player_id,
        game_context={
            "game_type": "8-ball",
            "score": (3, 2),
            "remaining_balls": [1, 2, 3, 8],
            "is_tournament": True,
            "stage": "quarterfinal",
        },
    )

    elapsed = time.time() - start_time
    print(f"Analysis completed in {elapsed:.2f} seconds")

    # Display recommendations
    print("\nShot Recommendations:")
    print("-" * 50)
    for i, shot in enumerate(recommendations, 1):
        print(f"\nShot {i}:")
        print(f"Type: {shot.shot_type.value}")
        print(f"Difficulty: {shot.difficulty.value}")
        print(f"Success Probability: {shot.success_probability:.1%}")
        print(f"Required Force: {shot.required_force:.1f}%")
        if shot.spin:
            print(f"Spin: ({shot.spin[0]:.1f}, {shot.spin[1]:.1f})")
        print(f"\nNarrative: {shot.narrative}")

    # Create visualization for best shot
    if recommendations:
        print("\nCreating visualization...")
        viz = draw_shot_recommendation(image, recommendations[0])

        # Save visualization
        cv2.imwrite(args.output, viz)
        print(f"Visualization saved to {args.output}")
    else:
        print("\nNo valid shots found")


if __name__ == "__main__":
    main()
