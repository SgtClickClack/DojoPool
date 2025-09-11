#include "table_physics.hpp"
#include <algorithm>

namespace dojopool {

TablePhysics::TablePhysics(const PhysicsConfig& config)
    : m_config(config) {
}

bool TablePhysics::handleBoundaryCollision(BallState& ball) {
    bool collisionOccurred = false;

    // Check left and right boundaries
    if (ball.position.x - ball.radius < 0.0f) {
        ball.position.x = ball.radius;
        ball.velocity.x = -ball.velocity.x * 0.8f; // Energy loss
        collisionOccurred = true;
    } else if (ball.position.x + ball.radius > m_config.tableWidth) {
        ball.position.x = m_config.tableWidth - ball.radius;
        ball.velocity.x = -ball.velocity.x * 0.8f;
        collisionOccurred = true;
    }

    // Check top and bottom boundaries
    if (ball.position.y - ball.radius < 0.0f) {
        ball.position.y = ball.radius;
        ball.velocity.y = -ball.velocity.y * 0.8f;
        collisionOccurred = true;
    } else if (ball.position.y + ball.radius > m_config.tableHeight) {
        ball.position.y = m_config.tableHeight - ball.radius;
        ball.velocity.y = -ball.velocity.y * 0.8f;
        collisionOccurred = true;
    }

    return collisionOccurred;
}

bool TablePhysics::isBallInBounds(const BallState& ball) const {
    return ball.position.x - ball.radius >= 0.0f &&
           ball.position.x + ball.radius <= m_config.tableWidth &&
           ball.position.y - ball.radius >= 0.0f &&
           ball.position.y + ball.radius <= m_config.tableHeight;
}

Vec2 TablePhysics::getTableDimensions() const {
    return {m_config.tableWidth, m_config.tableHeight};
}

bool TablePhysics::isPositionValid(const Vec2& position) const {
    return position.x >= 0.0f && position.x <= m_config.tableWidth &&
           position.y >= 0.0f && position.y <= m_config.tableHeight;
}

Trajectory TablePhysics::calculateBankShot(Vec2 start, Vec2 cushion, Vec2 target,
                                          float power, float spinX, float spinY) {
    Trajectory trajectory;

    // Calculate reflection point on cushion
    Vec2 cushionToStart = start - cushion;
    Vec2 cushionToTarget = target - cushion;
    float distance = cushionToStart.length();

    if (distance == 0.0f) {
        return trajectory;
    }

    // Normalize and calculate reflection
    Vec2 normal = cushionToStart.normalized();
    float dotProduct = cushionToTarget.dot(normal);
    Vec2 reflection = cushionToTarget - normal * (2.0f * dotProduct);

    // Calculate final target position
    Vec2 finalTarget = cushion + reflection.normalized() * (m_config.tableWidth / 2.0f);

    // Calculate shot trajectory to cushion, then reflection
    Vec2 shotDirection = (cushion - start).normalized();
    float shotVelocity = power * 3.0f;

    BallState ball(start, shotDirection * shotVelocity, {spinX, spinY}, BALL_RADIUS, true, -2);

    float time = 0.0f;
    const float maxTime = 8.0f;
    bool hitCushion = false;

    while (time < maxTime && trajectory.size() < m_config.maxTrajectoryPoints) {
        trajectory.emplace_back(ball.position, ball.velocity, time, true);

        // Check if ball hit cushion area
        if (!hitCushion) {
            Vec2 distanceToCushion = ball.position - cushion;
            if (distanceToCushion.lengthSquared() < BALL_RADIUS * BALL_RADIUS * 4) {
                // Apply reflection
                ball.velocity = reflection.normalized() * ball.velocity.length() * 0.9f;
                hitCushion = true;
            }
        }

        // Update ball physics (without friction for trajectory prediction)
        ball.position += ball.velocity * m_config.timeStep;
        time += m_config.timeStep;

        // Check if ball stopped
        if (ball.velocity.lengthSquared() < m_config.minVelocity * m_config.minVelocity) {
            trajectory.emplace_back(ball.position, Vec2{}, time, true);
            break;
        }
    }

    return trajectory;
}

} // namespace dojopool
