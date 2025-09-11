/**
 * DojoPool Physics Engine - WebAssembly Module
 *
 * High-performance physics calculations for pool ball trajectories,
 * collision detection, and spin effects optimized for WebAssembly.
 *
 * This module provides:
 * - Ball trajectory prediction with spin
 * - Collision detection and response
 * - Friction and damping calculations
 * - Multi-ball interaction physics
 * - Real-time performance for 60fps gameplay
 */

#include <emscripten.h>
#include <emscripten/bind.h>
#include <vector>
#include <cmath>
#include <algorithm>

using namespace emscripten;

// Physics constants optimized for pool table dimensions
const float TABLE_WIDTH = 9.0f;        // Standard 9ft table width
const float TABLE_HEIGHT = 4.5f;       // Standard 9ft table height
const float BALL_RADIUS = 0.028575f;   // Standard pool ball radius (1.125 inches)
const float FRICTION_COEFFICIENT = 0.02f;
const float SPIN_DECAY_RATE = 0.98f;
const float GRAVITY = 9.81f;
const float TIME_STEP = 1.0f / 120.0f; // 120fps simulation for accuracy
const float MIN_VELOCITY = 0.001f;     // Stop simulation when velocity drops below this

// Ball state structure for efficient memory layout
struct BallState {
    float x, y;           // Position
    float vx, vy;         // Velocity
    float ax, ay;         // Angular velocity (spin)
    float radius;         // Ball radius
    bool active;          // Whether ball is still in play
    int id;               // Ball identifier

    BallState(float px = 0, float py = 0, float vvx = 0, float vvy = 0,
              float aax = 0, float aay = 0, float rad = BALL_RADIUS,
              bool act = true, int ballId = 0)
        : x(px), y(py), vx(vvx), vy(vvy), ax(aax), ay(aay),
          radius(rad), active(act), id(ballId) {}
};

// Trajectory prediction result
struct TrajectoryPoint {
    float x, y;           // Position
    float vx, vy;         // Velocity at this point
    float time;           // Time from start
    bool valid;           // Whether this point is valid

    TrajectoryPoint(float px = 0, float py = 0, float vvx = 0, float vvy = 0,
                   float t = 0, bool v = true)
        : x(px), y(py), vx(vvx), vy(vvy), time(t), valid(v) {}
};

// Collision detection result
struct CollisionResult {
    bool collided;
    float timeToCollision;
    int ballA, ballB;
    float contactX, contactY;

    CollisionResult(bool c = false, float t = 0, int a = -1, int b = -1,
                   float cx = 0, float cy = 0)
        : collided(c), timeToCollision(t), ballA(a), ballB(b),
          contactX(cx), contactY(cy) {}
};

// Main physics engine class
class PoolPhysicsEngine {
private:
    std::vector<BallState> balls;
    float tableWidth, tableHeight;
    float friction;

public:
    PoolPhysicsEngine(float width = TABLE_WIDTH, float height = TABLE_HEIGHT,
                     float frictionCoeff = FRICTION_COEFFICIENT)
        : tableWidth(width), tableHeight(height), friction(frictionCoeff) {}

    // Add a ball to the simulation
    void addBall(float x, float y, float vx, float vy, float ax, float ay, int id) {
        balls.emplace_back(x, y, vx, vy, ax, ay, BALL_RADIUS, true, id);
    }

    // Clear all balls
    void clearBalls() {
        balls.clear();
    }

    // Calculate trajectory for a single ball
    std::vector<TrajectoryPoint> calculateTrajectory(int ballId, float maxTime = 10.0f) {
        std::vector<TrajectoryPoint> trajectory;

        // Find the ball
        auto it = std::find_if(balls.begin(), balls.end(),
                              [ballId](const BallState& ball) { return ball.id == ballId; });
        if (it == balls.end()) return trajectory;

        BallState ball = *it;
        float time = 0.0f;

        while (time < maxTime && trajectory.size() < 1000) { // Prevent infinite loops
            // Store current state
            trajectory.emplace_back(ball.x, ball.y, ball.vx, ball.vy, time, true);

            // Apply physics
            updateBallPhysics(ball, TIME_STEP);

            // Check table boundaries
            handleTableCollision(ball);

            // Check if ball has stopped
            float speed = std::sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            if (speed < MIN_VELOCITY) {
                // Add final resting position
                trajectory.emplace_back(ball.x, ball.y, 0, 0, time, true);
                break;
            }

            time += TIME_STEP;
        }

        return trajectory;
    }

    // Simulate physics for all balls
    void simulateStep(float deltaTime) {
        // Update all balls
        for (auto& ball : balls) {
            if (!ball.active) continue;
            updateBallPhysics(ball, deltaTime);
            handleTableCollision(ball);
        }

        // Check collisions between balls
        checkBallCollisions();

        // Remove inactive balls
        balls.erase(
            std::remove_if(balls.begin(), balls.end(),
                          [](const BallState& ball) { return !ball.active; }),
            balls.end()
        );
    }

    // Get current ball states
    std::vector<BallState> getBallStates() const {
        return balls;
    }

    // Calculate optimal shot trajectory
    TrajectoryPoint calculateShot(float startX, float startY, float targetX, float targetY,
                                 float power, float spinX = 0, float spinY = 0) {
        // Calculate direction and initial velocity
        float dx = targetX - startX;
        float dy = targetY - startY;
        float distance = std::sqrt(dx * dx + dy * dy);

        if (distance == 0) return TrajectoryPoint(startX, startY, 0, 0, 0, false);

        // Normalize direction and apply power
        float dirX = dx / distance;
        float dirY = dy / distance;
        float velocity = power * 3.0f; // Scale power to reasonable velocity

        // Add ball to simulation temporarily
        int tempId = -1;
        addBall(startX, startY, dirX * velocity, dirY * velocity, spinX, spinY, tempId);

        // Simulate until ball reaches target area or stops
        float time = 0;
        while (time < 15.0f) { // Max 15 seconds
            simulateStep(TIME_STEP);
            time += TIME_STEP;

            // Check if any ball reached target area
            for (const auto& ball : balls) {
                if (ball.id == tempId) {
                    float distToTarget = std::sqrt(
                        (ball.x - targetX) * (ball.x - targetX) +
                        (ball.y - targetY) * (ball.y - targetY)
                    );

                    if (distToTarget < BALL_RADIUS * 2) {
                        TrajectoryPoint result(ball.x, ball.y, ball.vx, ball.vy, time, true);
                        clearBalls(); // Clean up
                        return result;
                    }
                }
            }
        }

        clearBalls(); // Clean up
        return TrajectoryPoint(0, 0, 0, 0, 0, false);
    }

    // Calculate cue ball deflection for bank shots
    std::vector<TrajectoryPoint> calculateBankShot(float startX, float startY,
                                                  float targetX, float targetY,
                                                  float cushionX, float cushionY) {
        std::vector<TrajectoryPoint> trajectory;

        // Calculate reflection point on cushion
        float dx = cushionX - startX;
        float dy = cushionY - startY;
        float distance = std::sqrt(dx * dx + dy * dy);

        if (distance == 0) return trajectory;

        // Normalize and calculate reflection
        float normalX = dx / distance;
        float normalY = dy / distance;

        // For bank shots, we need to calculate the angle of incidence = angle of reflection
        float incidentX = targetX - cushionX;
        float incidentY = targetY - cushionY;
        float incidentLength = std::sqrt(incidentX * incidentX + incidentY * incidentY);

        if (incidentLength == 0) return trajectory;

        float incidentNormalX = incidentX / incidentLength;
        float incidentNormalY = incidentY / incidentLength;

        // Calculate reflection vector
        float dotProduct = incidentNormalX * normalX + incidentNormalY * normalY;
        float reflectX = incidentNormalX - 2 * dotProduct * normalX;
        float reflectY = incidentNormalY - 2 * dotProduct * normalY;

        // Calculate final target position
        float finalTargetX = cushionX + reflectX * (tableWidth / 2);
        float finalTargetY = cushionY + reflectY * (tableHeight / 2);

        // Use existing trajectory calculation
        int tempId = -2;
        addBall(startX, startY, reflectX * 2.0f, reflectY * 2.0f, 0, 0, tempId);

        auto traj = calculateTrajectory(tempId, 8.0f);

        // Adjust trajectory to account for cushion reflection
        for (auto& point : traj) {
            if (point.x >= cushionX - BALL_RADIUS && point.x <= cushionX + BALL_RADIUS &&
                point.y >= cushionY - BALL_RADIUS && point.y <= cushionY + BALL_RADIUS) {
                // Apply reflection at cushion
                point.x = cushionX + reflectX * (point.x - cushionX);
                point.y = cushionY + reflectY * (point.y - cushionY);
            }
        }

        clearBalls();
        return traj;
    }

private:
    // Update ball physics with friction and spin
    void updateBallPhysics(BallState& ball, float deltaTime) {
        // Apply friction to linear velocity
        float speed = std::sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        if (speed > 0) {
            float frictionForce = friction * GRAVITY * deltaTime;
            float newSpeed = std::max(0.0f, speed - frictionForce);

            if (newSpeed > 0) {
                ball.vx *= (newSpeed / speed);
                ball.vy *= (newSpeed / speed);
            } else {
                ball.vx = 0;
                ball.vy = 0;
            }
        }

        // Apply spin decay
        ball.ax *= SPIN_DECAY_RATE;
        ball.ay *= SPIN_DECAY_RATE;

        // Update position
        ball.x += ball.vx * deltaTime;
        ball.y += ball.vy * deltaTime;
    }

    // Handle table boundary collisions
    void handleTableCollision(BallState& ball) {
        // Left and right cushions
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx * 0.8f; // Energy loss on collision
        } else if (ball.x + ball.radius > tableWidth) {
            ball.x = tableWidth - ball.radius;
            ball.vx = -ball.vx * 0.8f;
        }

        // Top and bottom cushions
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy * 0.8f;
        } else if (ball.y + ball.radius > tableHeight) {
            ball.y = tableHeight - ball.radius;
            ball.vy = -ball.vy * 0.8f;
        }
    }

    // Check for collisions between balls
    void checkBallCollisions() {
        for (size_t i = 0; i < balls.size(); ++i) {
            for (size_t j = i + 1; j < balls.size(); ++j) {
                BallState& ballA = balls[i];
                BallState& ballB = balls[j];

                if (!ballA.active || !ballB.active) continue;

                float dx = ballB.x - ballA.x;
                float dy = ballB.y - ballA.y;
                float distance = std::sqrt(dx * dx + dy * dy);
                float minDistance = ballA.radius + ballB.radius;

                if (distance < minDistance) {
                    // Collision detected - resolve collision
                    resolveBallCollision(ballA, ballB, dx, dy, distance);
                }
            }
        }
    }

    // Resolve collision between two balls
    void resolveBallCollision(BallState& ballA, BallState& ballB,
                             float dx, float dy, float distance) {
        // Normalize collision vector
        float nx = dx / distance;
        float ny = dy / distance;

        // Separate balls to prevent overlap
        float overlap = (ballA.radius + ballB.radius) - distance;
        float separationX = nx * overlap * 0.5f;
        float separationY = ny * overlap * 0.5f;

        ballA.x -= separationX;
        ballA.y -= separationY;
        ballB.x += separationX;
        ballB.y += separationY;

        // Calculate relative velocity
        float relativeVx = ballB.vx - ballA.vx;
        float relativeVy = ballB.vy - ballA.vy;

        // Calculate relative velocity along collision normal
        float relativeVelocity = relativeVx * nx + relativeVy * ny;

        // Don't resolve if balls are separating
        if (relativeVelocity > 0) return;

        // Calculate impulse
        float impulse = 2 * relativeVelocity / 2; // Assuming equal mass

        // Apply impulse
        ballA.vx += impulse * nx;
        ballA.vy += impulse * ny;
        ballB.vx -= impulse * nx;
        ballB.vy -= impulse * ny;
    }
};

// JavaScript bindings for WebAssembly
EMSCRIPTEN_BINDINGS(pool_physics) {
    class_<BallState>("BallState")
        .constructor<>()
        .constructor<float, float, float, float, float, float, float, bool, int>()
        .property("x", &BallState::x)
        .property("y", &BallState::y)
        .property("vx", &BallState::vx)
        .property("vy", &BallState::vy)
        .property("ax", &BallState::ax)
        .property("ay", &BallState::ay)
        .property("radius", &BallState::radius)
        .property("active", &BallState::active)
        .property("id", &BallState::id);

    class_<TrajectoryPoint>("TrajectoryPoint")
        .constructor<>()
        .property("x", &TrajectoryPoint::x)
        .property("y", &TrajectoryPoint::y)
        .property("vx", &TrajectoryPoint::vx)
        .property("vy", &TrajectoryPoint::vy)
        .property("time", &TrajectoryPoint::time)
        .property("valid", &TrajectoryPoint::valid);

    class_<CollisionResult>("CollisionResult")
        .constructor<>()
        .property("collided", &CollisionResult::collided)
        .property("timeToCollision", &CollisionResult::timeToCollision)
        .property("ballA", &CollisionResult::ballA)
        .property("ballB", &CollisionResult::ballB)
        .property("contactX", &CollisionResult::contactX)
        .property("contactY", &CollisionResult::contactY);

    class_<PoolPhysicsEngine>("PoolPhysicsEngine")
        .constructor<>()
        .constructor<float, float, float>()
        .function("addBall", &PoolPhysicsEngine::addBall)
        .function("clearBalls", &PoolPhysicsEngine::clearBalls)
        .function("calculateTrajectory", &PoolPhysicsEngine::calculateTrajectory)
        .function("simulateStep", &PoolPhysicsEngine::simulateStep)
        .function("getBallStates", &PoolPhysicsEngine::getBallStates)
        .function("calculateShot", &PoolPhysicsEngine::calculateShot)
        .function("calculateBankShot", &PoolPhysicsEngine::calculateBankShot);

    register_vector<BallState>("VectorBallState");
    register_vector<TrajectoryPoint>("VectorTrajectoryPoint");
}
