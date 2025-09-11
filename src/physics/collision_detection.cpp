#include "collision_detection.hpp"
#include <algorithm>
#include <cmath>

namespace dojopool {

CollisionDetection::CollisionDetection(const PhysicsConfig& config)
    : m_config(config) {
}

std::vector<CollisionResult> CollisionDetection::detectCollisions(BallStates& balls) {
    std::vector<CollisionResult> collisions;

    for (size_t i = 0; i < balls.size(); ++i) {
        for (size_t j = i + 1; j < balls.size(); ++j) {
            BallState& ballA = balls[i];
            BallState& ballB = balls[j];

            if (!ballA.active || !ballB.active) continue;

            CollisionResult result = detectBallCollision(ballA, ballB);
            if (result.collided) {
                collisions.push_back(result);
            }
        }
    }

    return collisions;
}

CollisionResult CollisionDetection::detectBallCollision(const BallState& ballA, const BallState& ballB) const {
    Vec2 distanceVec = calculateBallDistance(ballA, ballB);
    float distance = distanceVec.length();
    float minDistance = ballA.radius + ballB.radius;

    if (distance < minDistance) {
        // Calculate contact point
        Vec2 contactPoint = ballA.position + distanceVec.normalized() * ballA.radius;

        return {true, 0.0f, ballA.id, ballB.id, contactPoint};
    }

    return {};
}

void CollisionDetection::resolveBallCollision(BallState& ballA, BallState& ballB, const CollisionResult& collision) {
    Vec2 distanceVec = calculateBallDistance(ballA, ballB);
    float distance = distanceVec.length();
    float minDistance = ballA.radius + ballB.radius;

    if (distance < minDistance) {
        // Separate balls
        float overlap = minDistance - distance;
        Vec2 normal = distanceVec.normalized();
        separateBalls(ballA, ballB, overlap, normal);

        // Calculate and apply collision impulse
        if (!areBallsSeparating(ballA, ballB, normal)) {
            Vec2 impulse = calculateCollisionImpulse(ballA, ballB, normal);

            ballA.velocity += impulse;
            ballB.velocity -= impulse;
        }
    }
}

void CollisionDetection::separateBalls(BallState& ballA, BallState& ballB, float overlap, const Vec2& normal) {
    float separation = overlap * 0.5f;
    Vec2 separationVec = normal * separation;

    ballA.position -= separationVec;
    ballB.position += separationVec;
}

Vec2 CollisionDetection::calculateCollisionImpulse(const BallState& ballA, const BallState& ballB,
                                                 const Vec2& normal) const {
    // Calculate relative velocity
    Vec2 relativeVelocity = ballB.velocity - ballA.velocity;
    float velocityAlongNormal = relativeVelocity.dot(normal);

    // Don't resolve if balls are separating
    if (velocityAlongNormal > 0) {
        return {0.0f, 0.0f};
    }

    // Calculate impulse (assuming equal mass)
    float impulseMagnitude = -2.0f * velocityAlongNormal / 2.0f;
    return normal * impulseMagnitude;
}

bool CollisionDetection::areBallsSeparating(const BallState& ballA, const BallState& ballB,
                                          const Vec2& normal) const {
    Vec2 relativeVelocity = ballB.velocity - ballA.velocity;
    return relativeVelocity.dot(normal) > 0;
}

Vec2 CollisionDetection::calculateBallDistance(const BallState& ballA, const BallState& ballB) const {
    return ballB.position - ballA.position;
}

float CollisionDetection::calculateOverlap(const BallState& ballA, const BallState& ballB) const {
    float distance = calculateBallDistance(ballA, ballB).length();
    float minDistance = ballA.radius + ballB.radius;
    return std::max(0.0f, minDistance - distance);
}

} // namespace dojopool
