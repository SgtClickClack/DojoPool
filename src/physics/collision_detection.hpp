#pragma once

#include "physics_types.hpp"
#include <vector>

namespace dojopool {

/**
 * @brief Handles collision detection and resolution between balls and other objects
 */
class CollisionDetection {
public:
    explicit CollisionDetection(const PhysicsConfig& config = {});
    ~CollisionDetection() = default;

    // Prevent copying
    CollisionDetection(const CollisionDetection&) = delete;
    CollisionDetection& operator=(const CollisionDetection&) = delete;

    // Allow moving
    CollisionDetection(CollisionDetection&&) noexcept = default;
    CollisionDetection& operator=(CollisionDetection&&) noexcept = default;

    /**
     * @brief Check for collisions between all balls in the collection
     * @param balls Collection of ball states
     * @return Vector of collision results
     */
    std::vector<CollisionResult> detectCollisions(BallStates& balls);

    /**
     * @brief Check collision between two specific balls
     * @param ballA First ball
     * @param ballB Second ball
     * @return Collision result
     */
    CollisionResult detectBallCollision(const BallState& ballA, const BallState& ballB) const;

    /**
     * @brief Resolve collision between two balls
     * @param ballA First ball (modified)
     * @param ballB Second ball (modified)
     * @param collision Information about the collision
     */
    void resolveBallCollision(BallState& ballA, BallState& ballB, const CollisionResult& collision);

    /**
     * @brief Separate overlapping balls
     * @param ballA First ball
     * @param ballB Second ball
     * @param overlap Amount of overlap
     * @param normal Collision normal vector
     */
    void separateBalls(BallState& ballA, BallState& ballB, float overlap, const Vec2& normal);

    /**
     * @brief Calculate collision impulse for two balls
     * @param ballA First ball
     * @param ballB Second ball
     * @param normal Collision normal
     * @return Impulse vector
     */
    Vec2 calculateCollisionImpulse(const BallState& ballA, const BallState& ballB, const Vec2& normal) const;

    /**
     * @brief Check if two balls are moving apart
     * @param ballA First ball
     * @param ballB Second ball
     * @param normal Collision normal
     * @return true if balls are separating
     */
    bool areBallsSeparating(const BallState& ballA, const BallState& ballB, const Vec2& normal) const;

private:
    PhysicsConfig m_config;

    /**
     * @brief Calculate distance between ball centers
     * @param ballA First ball
     * @param ballB Second ball
     * @return Distance vector
     */
    Vec2 calculateBallDistance(const BallState& ballA, const BallState& ballB) const;

    /**
     * @brief Check if two balls are overlapping
     * @param ballA First ball
     * @param ballB Second ball
     * @return Amount of overlap (0 if not overlapping)
     */
    float calculateOverlap(const BallState& ballA, const BallState& ballB) const;
};

} // namespace dojopool
