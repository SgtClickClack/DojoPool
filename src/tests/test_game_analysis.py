import pytest
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from ..models.game_analysis import GameAnalysis, ShotAnalysis, PerformanceInsight
import numpy as np
from datetime import timedelta


class TestGameAnalysis(TestCase):
    def setUp(self):
        # Create test users
        self.player1 = User.objects.create_user(username="player1", password="test123")
        self.player2 = User.objects.create_user(username="player2", password="test123")

        # Create test game
        self.game = GameAnalysis.objects.create(
            game_id="test_game_001",
            game_type="8ball",
            player1=self.player1,
            player2=self.player2,
            winner=self.player1,
            start_time=timezone.now() - timedelta(minutes=30),
            end_time=timezone.now(),
            total_shots=20,
            successful_shots=15,
            average_shot_difficulty=0.6,
            average_position_score=0.7,
            breaks_attempted=2,
            balls_pocketed_on_break=3,
        )

        # Create test shots
        self.shots = []
        for i in range(5):
            shot = ShotAnalysis.objects.create(
                game=self.game,
                player=self.player1 if i % 2 == 0 else self.player2,
                shot_number=i + 1,
                shot_type="straight",
                difficulty=0.5,
                success=True,
                position_score=0.7,
                english_applied=0.0,
                speed=0.5,
                cue_ball_start={"x": 100, "y": 100},
                object_ball_start={"x": 200, "y": 200},
                target_pocket={"x": 300, "y": 300},
            )
            self.shots.append(shot)

    def test_game_metrics_calculation(self):
        metrics = self.game.calculate_metrics()

        self.assertAlmostEqual(metrics["accuracy"], 0.75)  # 15/20
        self.assertEqual(metrics["avg_difficulty"], 0.6)
        self.assertEqual(metrics["position_score"], 0.7)
        self.assertAlmostEqual(metrics["break_success"], 1.5)  # 3/2
        self.assertTrue(isinstance(metrics["game_duration"], float))

    def test_shot_difficulty_calculation(self):
        shot = self.shots[0]
        difficulty = shot.calculate_difficulty()

        # Test individual factors
        distance_factor = shot._calculate_distance_factor()
        angle_factor = shot._calculate_angle_factor()
        obstacle_factor = shot._calculate_obstacle_factor()
        speed_factor = shot._calculate_speed_factor()

        self.assertTrue(0 <= difficulty <= 1)
        self.assertTrue(0 <= distance_factor <= 1)
        self.assertTrue(0 <= angle_factor <= 1)
        self.assertTrue(0 <= obstacle_factor <= 1)
        self.assertTrue(0 <= speed_factor <= 1)

    def test_performance_insights_generation(self):
        # Create additional test games for better analysis
        for i in range(3):
            game = GameAnalysis.objects.create(
                game_id=f"test_game_{i+2:03d}",
                game_type="8ball",
                player1=self.player1,
                player2=self.player2,
                winner=self.player1 if i % 2 == 0 else self.player2,
                start_time=timezone.now() - timedelta(minutes=30),
                end_time=timezone.now(),
                total_shots=20,
                successful_shots=15,
                average_shot_difficulty=0.6,
                average_position_score=0.7,
                breaks_attempted=2,
                balls_pocketed_on_break=3,
            )

            # Add shots to each game
            for j in range(5):
                ShotAnalysis.objects.create(
                    game=game,
                    player=self.player1 if j % 2 == 0 else self.player2,
                    shot_number=j + 1,
                    shot_type="straight" if j % 2 == 0 else "bank",
                    difficulty=0.5,
                    success=True,
                    position_score=0.7,
                    english_applied=0.0,
                    speed=0.5,
                    cue_ball_start={"x": 100, "y": 100},
                    object_ball_start={"x": 200, "y": 200},
                    target_pocket={"x": 300, "y": 300},
                )

        # Get recent games
        recent_games = GameAnalysis.objects.filter(player1=self.player1).order_by("-created_at")[:5]

        # Generate insights
        insights = PerformanceInsight.generate_insights(self.player1, list(recent_games))

        self.assertTrue(len(insights) > 0)
        for insight in insights:
            self.assertIn(
                insight.insight_type,
                ["strength", "weakness", "improvement", "pattern", "recommendation"],
            )
            self.assertTrue(insight.title)
            self.assertTrue(insight.description)
            self.assertTrue(isinstance(insight.metrics, dict))
            self.assertTrue(0 <= insight.confidence <= 1)

    def test_shot_pattern_analysis(self):
        recent_games = GameAnalysis.objects.filter(player1=self.player1).order_by("-created_at")[:5]

        patterns = PerformanceInsight._analyze_shot_patterns(list(recent_games))

        self.assertIn("preferred_shots", patterns)
        self.assertIn("success_rates", patterns)
        self.assertTrue(isinstance(patterns["preferred_shots"], dict))
        self.assertTrue(isinstance(patterns["success_rates"], dict))

        # Test shot type distribution
        total_shots = sum(patterns["preferred_shots"].values())
        self.assertTrue(total_shots > 0)

        # Test success rates calculation
        for shot_type, stats in patterns["success_rates"].items():
            self.assertIn("total", stats)
            self.assertIn("success", stats)
            self.assertTrue(stats["success"] <= stats["total"])

    def test_performance_analysis(self):
        recent_games = GameAnalysis.objects.filter(player1=self.player1).order_by("-created_at")[:5]

        analysis = PerformanceInsight._analyze_performance(list(recent_games))

        self.assertIn("accuracy", analysis)
        self.assertIn("avg_difficulty", analysis)
        self.assertIn("position_score", analysis)

        self.assertTrue(0 <= analysis["accuracy"] <= 1)
        self.assertTrue(0 <= analysis["avg_difficulty"] <= 1)
        self.assertTrue(0 <= analysis["position_score"] <= 1)

    def test_recommendation_generation(self):
        performance = {"accuracy": 0.5, "avg_difficulty": 0.6, "position_score": 0.4}

        recommendations = PerformanceInsight._generate_recommendations(performance)

        self.assertTrue(isinstance(recommendations, dict))
        for aspect, recommendation in recommendations.items():
            self.assertIn("description", recommendation)
            self.assertIn("metrics", recommendation)
            self.assertIn("confidence", recommendation)
            self.assertTrue(0 <= recommendation["confidence"] <= 1)

    def test_edge_cases(self):
        # Test game with no shots
        empty_game = GameAnalysis.objects.create(
            game_id="empty_game",
            game_type="8ball",
            player1=self.player1,
            player2=self.player2,
            winner=self.player1,
            start_time=timezone.now() - timedelta(minutes=30),
            end_time=timezone.now(),
            total_shots=0,
            successful_shots=0,
            average_shot_difficulty=0,
            average_position_score=0,
            breaks_attempted=0,
            balls_pocketed_on_break=0,
        )

        metrics = empty_game.calculate_metrics()
        self.assertEqual(metrics["accuracy"], 0)
        self.assertEqual(metrics["break_success"], 0)

        # Test shot with missing pocket
        shot = ShotAnalysis.objects.create(
            game=self.game,
            player=self.player1,
            shot_number=10,
            shot_type="straight",
            difficulty=0.5,
            success=True,
            position_score=0.7,
            english_applied=0.0,
            speed=0.5,
            cue_ball_start={"x": 100, "y": 100},
            object_ball_start={"x": 200, "y": 200},
            target_pocket=None,
        )

        angle_factor = shot._calculate_angle_factor()
        self.assertEqual(angle_factor, 0.5)  # Default value for shots without pocket

        # Test game with extreme values
        extreme_game = GameAnalysis.objects.create(
            game_id="extreme_game",
            game_type="8ball",
            player1=self.player1,
            player2=self.player2,
            winner=self.player1,
            start_time=timezone.now() - timedelta(minutes=30),
            end_time=timezone.now(),
            total_shots=1000,
            successful_shots=1000,
            average_shot_difficulty=1.0,
            average_position_score=1.0,
            breaks_attempted=100,
            balls_pocketed_on_break=100,
        )

        metrics = extreme_game.calculate_metrics()
        self.assertEqual(metrics["accuracy"], 1.0)
        self.assertEqual(metrics["avg_difficulty"], 1.0)
        self.assertEqual(metrics["position_score"], 1.0)
        self.assertEqual(metrics["break_success"], 1.0)
