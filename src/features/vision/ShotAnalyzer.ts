import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

interface BallPosition {
  id: number;
  x: number;
  y: number;
  confidence: number;
}

interface ShotAnalysis {
  difficulty: number;
  success_probability: number;
  suggested_power: number;
  suggested_english: string;
  potential_obstacles: BallPosition[];
}

export class ShotAnalyzer {
  private model: tf.LayersModel | null = null;
  private isModelLoading = false;

  constructor() {
    this.initializeModel();
  }

  private async initializeModel() {
    if (this.model || this.isModelLoading) return;

    this.isModelLoading = true;
    try {
      // Load pre-trained model for shot analysis
      this.model = await tf.loadLayersModel("/models/shot-analyzer/model.json");
      await tf.ready();
    } catch (error) {
      console.error("Failed to load shot analysis model:", error);
    } finally {
      this.isModelLoading = false;
    }
  }

  private async detectBalls(frame: ImageData): Promise<BallPosition[]> {
    if (!this.model) throw new Error("Model not loaded");

    const tensor = tf.browser
      .fromPixels(frame)
      .expandDims(0)
      .toFloat()
      .div(255.0);

    const predictions = (await this.model.predict(tensor)) as tf.Tensor;
    const balls: BallPosition[] = [];

    // Process predictions to get ball positions
    const [boxes, scores, classes] = await Promise.all([
      predictions.slice([0, 0, 0], [-1, -1, 4]).array(),
      predictions.slice([0, 0, 4], [-1, -1, 1]).array(),
      predictions.slice([0, 0, 5], [-1, -1, 1]).array(),
    ]);

    // Convert predictions to ball positions
    boxes[0].forEach((box, idx) => {
      if (scores[0][idx] > 0.5) {
        balls.push({
          id: Math.floor(classes[0][idx]),
          x: (box[0] + box[2]) / 2,
          y: (box[1] + box[3]) / 2,
          confidence: scores[0][idx],
        });
      }
    });

    // Cleanup
    tensor.dispose();
    predictions.dispose();

    return balls;
  }

  private calculateShotDifficulty(
    cueBall: BallPosition,
    targetBall: BallPosition,
    obstacles: BallPosition[],
  ): number {
    // Calculate base difficulty based on distance
    const distance = Math.sqrt(
      Math.pow(targetBall.x - cueBall.x, 2) +
        Math.pow(targetBall.y - cueBall.y, 2),
    );

    // Calculate angle difficulty
    const angle = Math.atan2(
      targetBall.y - cueBall.y,
      targetBall.x - cueBall.x,
    );

    // Check for obstacles in the path
    const obstacleFactors = obstacles.map((obstacle) => {
      if (obstacle.id === cueBall.id || obstacle.id === targetBall.id) return 0;

      // Calculate if obstacle is in the path
      const obstacleAngle = Math.atan2(
        obstacle.y - cueBall.y,
        obstacle.x - cueBall.x,
      );
      const angleDiff = Math.abs(angle - obstacleAngle);

      if (angleDiff < 0.5) {
        // If obstacle is roughly in the path
        const obstacleDistance = Math.sqrt(
          Math.pow(obstacle.x - cueBall.x, 2) +
            Math.pow(obstacle.y - cueBall.y, 2),
        );
        return obstacleDistance < distance ? 0.5 : 0;
      }
      return 0;
    });

    const obstacleDifficulty = Math.max(...obstacleFactors);

    // Combine factors for final difficulty score (0-1)
    return Math.min(
      1,
      distance * 0.3 + // Distance factor
        Math.abs(angle) * 0.2 + // Angle factor
        obstacleDifficulty * 0.5, // Obstacle factor
    );
  }

  public async analyzePotentialShot(
    frame: ImageData,
    cueBallId: number,
    targetBallId: number,
  ): Promise<ShotAnalysis> {
    const balls = await this.detectBalls(frame);

    const cueBall = balls.find((b) => b.id === cueBallId);
    const targetBall = balls.find((b) => b.id === targetBallId);

    if (!cueBall || !targetBall) {
      throw new Error("Could not detect required balls");
    }

    const difficulty = this.calculateShotDifficulty(
      cueBall,
      targetBall,
      balls.filter((b) => b.id !== cueBallId && b.id !== targetBallId),
    );

    // Calculate success probability based on difficulty
    const success_probability = Math.max(0, 1 - difficulty);

    // Calculate suggested power based on distance
    const distance = Math.sqrt(
      Math.pow(targetBall.x - cueBall.x, 2) +
        Math.pow(targetBall.y - cueBall.y, 2),
    );
    const suggested_power = Math.min(1, distance * 0.4);

    // Determine if english (spin) would be helpful
    const suggested_english = this.calculateSuggestedEnglish(
      cueBall,
      targetBall,
      balls,
    );

    return {
      difficulty,
      success_probability,
      suggested_power,
      suggested_english,
      potential_obstacles: balls.filter(
        (b) => b.id !== cueBallId && b.id !== targetBallId,
      ),
    };
  }

  private calculateSuggestedEnglish(
    cueBall: BallPosition,
    targetBall: BallPosition,
    allBalls: BallPosition[],
  ): string {
    // Calculate angle to target
    const angle = Math.atan2(
      targetBall.y - cueBall.y,
      targetBall.x - cueBall.x,
    );

    // Check for nearby cushions and obstacles
    const nearbyObstacles = allBalls.filter((ball) => {
      if (ball.id === cueBall.id || ball.id === targetBall.id) return false;

      const distance = Math.sqrt(
        Math.pow(ball.x - targetBall.x, 2) + Math.pow(ball.y - targetBall.y, 2),
      );

      return distance < 0.2; // Within 20% of table width
    });

    // Suggest english based on position and obstacles
    if (nearbyObstacles.length > 0) {
      // If obstacles are present, suggest english to help avoid them
      const obstacleAngle = Math.atan2(
        nearbyObstacles[0].y - targetBall.y,
        nearbyObstacles[0].x - targetBall.x,
      );

      const angleDiff = angle - obstacleAngle;
      return angleDiff > 0 ? "right" : "left";
    }

    // Default to no english for straight shots
    return "center";
  }
}

export default ShotAnalyzer;
