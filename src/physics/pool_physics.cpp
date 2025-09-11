#include "pool_physics.hpp"
#include <algorithm>

namespace dojopool {

PoolPhysicsEngine::PoolPhysicsEngine(const PhysicsConfig& config)
    : m_config(config),
      m_ballPhysics(std::make_unique<BallPhysics>(config)),
      m_tablePhysics(std::make_unique<TablePhysics>(config)),
      m_collisionDetection(std::make_unique<CollisionDetection>(config)) {
}

void PoolPhysicsEngine::addBall(Vec2 position, Vec2 velocity, Vec2 angularVelocity, int32_t id) {
    m_balls.emplace_back(position, velocity, angularVelocity, BALL_RADIUS, true, id);
}

void PoolPhysicsEngine::clearBalls() {
    m_balls.clear();
}

const BallStates& PoolPhysicsEngine::getBallStates() const {
    return m_balls;
}

void PoolPhysicsEngine::simulateStep(float deltaTime) {
    // Update all balls
    updateAllBalls(deltaTime);

    // Handle table collisions
    for (auto& ball : m_balls) {
        if (ball.active) {
            m_tablePhysics->handleBoundaryCollision(ball);
        }
    }

    // Handle ball collisions
    handleCollisions();

    // Remove inactive balls
    removeInactiveBalls();
}

Trajectory PoolPhysicsEngine::calculateTrajectory(int32_t ballId, float maxTime) {
    auto it = findBall(ballId);
    if (it == m_balls.end()) {
        return {};
    }

    return m_ballPhysics->calculateTrajectory(*it, maxTime);
}

TrajectoryPoint PoolPhysicsEngine::calculateShot(Vec2 start, Vec2 target, float power,
                                                float spinX, float spinY) {
    return m_ballPhysics->calculateShot(start, target, power, spinX, spinY);
}

Trajectory PoolPhysicsEngine::calculateBankShot(Vec2 start, Vec2 cushion, Vec2 target,
                                              float power, float spinX, float spinY) {
    return m_tablePhysics->calculateBankShot(start, cushion, target, power, spinX, spinY);
}

const PhysicsConfig& PoolPhysicsEngine::getConfig() const {
    return m_config;
}

void PoolPhysicsEngine::setConfig(const PhysicsConfig& config) {
    m_config = config;
    m_ballPhysics = std::make_unique<BallPhysics>(config);
    m_tablePhysics = std::make_unique<TablePhysics>(config);
    m_collisionDetection = std::make_unique<CollisionDetection>(config);
}

void PoolPhysicsEngine::updateAllBalls(float deltaTime) {
    for (auto& ball : m_balls) {
        if (ball.active) {
            m_ballPhysics->updateBall(ball, deltaTime);
        }
    }
}

void PoolPhysicsEngine::handleCollisions() {
    auto collisions = m_collisionDetection->detectCollisions(m_balls);

    for (const auto& collision : collisions) {
        auto ballA = findBall(collision.ballA);
        auto ballB = findBall(collision.ballB);

        if (ballA != m_balls.end() && ballB != m_balls.end()) {
            m_collisionDetection->resolveBallCollision(*ballA, *ballB, collision);
        }
    }
}

void PoolPhysicsEngine::removeInactiveBalls() {
    m_balls.erase(
        std::remove_if(m_balls.begin(), m_balls.end(),
                      [](const BallState& ball) { return !ball.active; }),
        m_balls.end()
    );
}

BallStates::iterator PoolPhysicsEngine::findBall(int32_t ballId) {
    return std::find_if(m_balls.begin(), m_balls.end(),
                       [ballId](const BallState& ball) { return ball.id == ballId; });
}

BallStates::const_iterator PoolPhysicsEngine::findBall(int32_t ballId) const {
    return std::find_if(m_balls.begin(), m_balls.end(),
                       [ballId](const BallState& ball) { return ball.id == ballId; });
}

} // namespace dojopool
