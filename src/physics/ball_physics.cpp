#include "ball_physics.hpp"
#include <algorithm>
#include <cmath>

namespace dojopool {

BallPhysics::BallPhysics(const PhysicsConfig& config)
    : m_config(config) {
}

void BallPhysics::updateBall(BallState& ball, float deltaTime) {
    if (!ball.active) return;

    // Apply friction
    applyFriction(ball, deltaTime);

    // Apply spin decay
    applySpinDecay(ball);

    // Update position
    ball.position += ball.velocity * deltaTime;
}

void BallPhysics::applyFriction(BallState& ball, float deltaTime) {
    float speed = ball.velocity.length();
    if (speed > 0.0f) {
        float frictionForce = m_config.frictionCoefficient * m_config.gravity * deltaTime;
        float newSpeed = std::max(0.0f, speed - frictionForce);

        if (newSpeed > 0.0f) {
            ball.velocity = ball.velocity.normalized() * newSpeed;
        } else {
            ball.velocity = {0.0f, 0.0f};
        }
    }
}

void BallPhysics::applySpinDecay(BallState& ball) {
    ball.angularVelocity *= m_config.spinDecayRate;
}

bool BallPhysics::isBallStopped(const BallState& ball) const {
    return ball.velocity.lengthSquared() < m_config.minVelocity * m_config.minVelocity;
}

Trajectory BallPhysics::calculateTrajectory(const BallState& initialState, float maxTime) {
    Trajectory trajectory;
    BallState ball = initialState;
    float time = 0.0f;

    while (time < maxTime && trajectory.size() < m_config.maxTrajectoryPoints) {
        // Store current state
        trajectory.emplace_back(ball.position, ball.velocity, time, true);

        // Apply physics
        updateBall(ball, m_config.timeStep);

        // Check if ball has stopped
        if (isBallStopped(ball)) {
            trajectory.emplace_back(ball.position, Vec2{}, time, true);
            break;
        }

        time += m_config.timeStep;
    }

    return trajectory;
}

TrajectoryPoint BallPhysics::calculateShot(Vec2 start, Vec2 target, float power,
                                          float spinX, float spinY) {
    // Calculate direction and distance
    Vec2 direction = target - start;
    float distance = direction.length();

    if (distance == 0.0f) {
        return {start, {0.0f, 0.0f}, 0.0f, false};
    }

    // Normalize direction and apply power
    direction = direction.normalized();
    float velocity = power * 3.0f; // Scale power to reasonable velocity
    Vec2 initialVelocity = direction * velocity;
    Vec2 spinVelocity = {spinX, spinY};

    // Create initial ball state
    BallState ball(start, initialVelocity, spinVelocity, BALL_RADIUS, true, -1);

    // Simulate until ball reaches target area
    float time = 0.0f;
    const float maxTime = 15.0f; // Maximum simulation time

    while (time < maxTime) {
        // Update ball physics
        updateBall(ball, m_config.timeStep);
        time += m_config.timeStep;

        // Check if ball reached target area
        Vec2 distanceToTarget = ball.position - target;
        if (distanceToTarget.lengthSquared() < BALL_RADIUS * BALL_RADIUS * 4) {
            return {ball.position, ball.velocity, time, true};
        }

        // Check if ball stopped
        if (isBallStopped(ball)) {
            break;
        }
    }

    return {ball.position, ball.velocity, time, false};
}

} // namespace dojopool
