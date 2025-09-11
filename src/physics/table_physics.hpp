#pragma once

#include "physics_types.hpp"
#include <memory>

namespace dojopool {

// Forward declarations
class BallPhysics;

/**
 * @brief Handles table boundary physics and cushion collisions
 */
class TablePhysics {
public:
    explicit TablePhysics(const PhysicsConfig& config = {});
    ~TablePhysics() = default;

    // Prevent copying
    TablePhysics(const TablePhysics&) = delete;
    TablePhysics& operator=(const TablePhysics&) = delete;

    // Allow moving
    TablePhysics(TablePhysics&&) noexcept = default;
    TablePhysics& operator=(TablePhysics&&) noexcept = default;

    /**
     * @brief Handle collision with table boundaries
     * @param ball The ball that hit a boundary
     * @return true if collision occurred
     */
    bool handleBoundaryCollision(BallState& ball);

    /**
     * @brief Check if ball is within table bounds
     * @param ball The ball to check
     * @return true if ball is within bounds
     */
    bool isBallInBounds(const BallState& ball) const;

    /**
     * @brief Get table dimensions
     * @return Vec2 containing width and height
     */
    Vec2 getTableDimensions() const;

    /**
     * @brief Check if position is within table bounds
     * @param position Position to check
     * @return true if position is within bounds
     */
    bool isPositionValid(const Vec2& position) const;

    /**
     * @brief Calculate bank shot trajectory
     * @param start Starting position
     * @param cushion Cushion contact point
     * @param target Target position
     * @param power Shot power
     * @param spinX Horizontal spin
     * @param spinY Vertical spin
     * @return Trajectory for bank shot
     */
    Trajectory calculateBankShot(Vec2 start, Vec2 cushion, Vec2 target,
                                float power, float spinX = 0.0f, float spinY = 0.0f);

private:
    PhysicsConfig m_config;

    /**
     * @brief Handle left/right cushion collision
     * @param ball The ball that hit the cushion
     */
    void handleVerticalCushionCollision(BallState& ball);

    /**
     * @brief Handle top/bottom cushion collision
     * @param ball The ball that hit the cushion
     */
    void handleHorizontalCushionCollision(BallState& ball);
};

} // namespace dojopool
