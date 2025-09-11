#pragma once

#include "physics_types.hpp"
#include "ball_physics.hpp"
#include "table_physics.hpp"
#include "collision_detection.hpp"
#include <memory>
#include <vector>

namespace dojopool {

/**
 * @brief Main physics engine for pool game simulation
 *
 * This class manages the complete physics simulation including ball movement,
 * collision detection, table interactions, and trajectory prediction.
 */
class PoolPhysicsEngine {
public:
    explicit PoolPhysicsEngine(const PhysicsConfig& config = {});
    ~PoolPhysicsEngine() = default;

    // Prevent copying
    PoolPhysicsEngine(const PoolPhysicsEngine&) = delete;
    PoolPhysicsEngine& operator=(const PoolPhysicsEngine&) = delete;

    // Allow moving
    PoolPhysicsEngine(PoolPhysicsEngine&&) noexcept = default;
    PoolPhysicsEngine& operator=(PoolPhysicsEngine&&) noexcept = default;

    /**
     * @brief Add a ball to the simulation
     * @param position Initial position
     * @param velocity Initial velocity
     * @param angularVelocity Initial angular velocity
     * @param id Ball identifier
     */
    void addBall(Vec2 position, Vec2 velocity = {}, Vec2 angularVelocity = {}, int32_t id = 0);

    /**
     * @brief Remove all balls from simulation
     */
    void clearBalls();

    /**
     * @brief Get current state of all balls
     * @return Vector of ball states
     */
    const BallStates& getBallStates() const;

    /**
     * @brief Advance physics simulation by one time step
     * @param deltaTime Time step in seconds
     */
    void simulateStep(float deltaTime);

    /**
     * @brief Calculate trajectory for a specific ball
     * @param ballId ID of the ball to track
     * @param maxTime Maximum simulation time
     * @return Trajectory points
     */
    Trajectory calculateTrajectory(int32_t ballId, float maxTime = 10.0f);

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

    /**
     * @brief Calculate bank shot trajectory
     * @param start Starting position
     * @param cushion Cushion contact point
     * @param target Target position
     * @param power Shot power
     * @param spinX Horizontal spin
     * @param spinY Vertical spin
     * @return Bank shot trajectory
     */
    Trajectory calculateBankShot(Vec2 start, Vec2 cushion, Vec2 target,
                                float power, float spinX = 0.0f, float spinY = 0.0f);

    /**
     * @brief Get physics configuration
     * @return Current physics configuration
     */
    const PhysicsConfig& getConfig() const;

    /**
     * @brief Update physics configuration
     * @param config New configuration
     */
    void setConfig(const PhysicsConfig& config);

private:
    PhysicsConfig m_config;
    BallStates m_balls;

    std::unique_ptr<BallPhysics> m_ballPhysics;
    std::unique_ptr<TablePhysics> m_tablePhysics;
    std::unique_ptr<CollisionDetection> m_collisionDetection;

    /**
     * @brief Update all balls physics
     * @param deltaTime Time step
     */
    void updateAllBalls(float deltaTime);

    /**
     * @brief Handle all collisions in the current frame
     */
    void handleCollisions();

    /**
     * @brief Remove inactive balls from simulation
     */
    void removeInactiveBalls();

    /**
     * @brief Find ball by ID
     * @param ballId Ball identifier
     * @return Iterator to ball or end iterator
     */
    BallStates::iterator findBall(int32_t ballId);

    /**
     * @brief Find ball by ID (const version)
     * @param ballId Ball identifier
     * @return Const iterator to ball or end iterator
     */
    BallStates::const_iterator findBall(int32_t ballId) const;
};

} // namespace dojopool
