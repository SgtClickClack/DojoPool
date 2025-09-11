#pragma once

#include "physics_types.hpp"
#include <memory>

namespace dojopool {

// Forward declarations
class TablePhysics;
class CollisionDetection;

/**
 * @brief Handles individual ball physics including motion, friction, and spin effects
 */
class BallPhysics {
public:
    explicit BallPhysics(const PhysicsConfig& config = {});
    ~BallPhysics() = default;

    // Prevent copying
    BallPhysics(const BallPhysics&) = delete;
    BallPhysics& operator=(const BallPhysics&) = delete;

    // Allow moving
    BallPhysics(BallPhysics&&) noexcept = default;
    BallPhysics& operator=(BallPhysics&&) noexcept = default;

    /**
     * @brief Update ball physics for a single time step
     * @param ball The ball state to update
     * @param deltaTime Time step in seconds
     */
    void updateBall(BallState& ball, float deltaTime);

    /**
     * @brief Apply friction to ball velocity
     * @param ball The ball to apply friction to
     * @param deltaTime Time step in seconds
     */
    void applyFriction(BallState& ball, float deltaTime);

    /**
     * @brief Apply spin decay to ball angular velocity
     * @param ball The ball to apply spin decay to
     */
    void applySpinDecay(BallState& ball);

    /**
     * @brief Check if ball has stopped moving
     * @param ball The ball to check
     * @return true if ball has effectively stopped
     */
    bool isBallStopped(const BallState& ball) const;

    /**
     * @brief Calculate ball trajectory without collision detection
     * @param initialState Initial ball state
     * @param maxTime Maximum simulation time in seconds
     * @return Trajectory points
     */
    Trajectory calculateTrajectory(const BallState& initialState, float maxTime = 10.0f);

    /**
     * @brief Calculate optimal shot trajectory
     * @param start Starting position
     * @param target Target position
     * @param power Shot power (0.0 to 1.0)
     * @param spinX Horizontal spin component
     * @param spinY Vertical spin component
     * @return Trajectory point at target
     */
    TrajectoryPoint calculateShot(Vec2 start, Vec2 target, float power,
                                 float spinX = 0.0f, float spinY = 0.0f);

private:
    PhysicsConfig m_config;
};

} // namespace dojopool
