#include <gtest/gtest.h>
#include "src/physics/physics_types.hpp"

namespace dojopool {

// Test Vec2 basic operations
TEST(Vec2Test, DefaultConstructor) {
    Vec2 v;
    EXPECT_FLOAT_EQ(v.x, 0.0f);
    EXPECT_FLOAT_EQ(v.y, 0.0f);
}

TEST(Vec2Test, ParameterizedConstructor) {
    Vec2 v(1.0f, 2.0f);
    EXPECT_FLOAT_EQ(v.x, 1.0f);
    EXPECT_FLOAT_EQ(v.y, 2.0f);
}

TEST(Vec2Test, Addition) {
    Vec2 a(1.0f, 2.0f);
    Vec2 b(3.0f, 4.0f);
    Vec2 result = a + b;
    EXPECT_FLOAT_EQ(result.x, 4.0f);
    EXPECT_FLOAT_EQ(result.y, 6.0f);
}

TEST(Vec2Test, Subtraction) {
    Vec2 a(5.0f, 7.0f);
    Vec2 b(3.0f, 2.0f);
    Vec2 result = a - b;
    EXPECT_FLOAT_EQ(result.x, 2.0f);
    EXPECT_FLOAT_EQ(result.y, 5.0f);
}

TEST(Vec2Test, ScalarMultiplication) {
    Vec2 v(2.0f, 3.0f);
    Vec2 result = v * 2.0f;
    EXPECT_FLOAT_EQ(result.x, 4.0f);
    EXPECT_FLOAT_EQ(result.y, 6.0f);
}

TEST(Vec2Test, Length) {
    Vec2 v(3.0f, 4.0f);
    EXPECT_FLOAT_EQ(v.length(), 5.0f);
}

TEST(Vec2Test, LengthSquared) {
    Vec2 v(3.0f, 4.0f);
    EXPECT_FLOAT_EQ(v.lengthSquared(), 25.0f);
}

TEST(Vec2Test, Normalized) {
    Vec2 v(3.0f, 4.0f);
    Vec2 normalized = v.normalized();
    EXPECT_FLOAT_EQ(normalized.length(), 1.0f);
    EXPECT_FLOAT_EQ(normalized.x, 0.6f);
    EXPECT_FLOAT_EQ(normalized.y, 0.8f);
}

TEST(Vec2Test, DotProduct) {
    Vec2 a(1.0f, 2.0f);
    Vec2 b(3.0f, 4.0f);
    EXPECT_FLOAT_EQ(a.dot(b), 11.0f);
}

TEST(Vec2Test, Perpendicular) {
    Vec2 v(1.0f, 2.0f);
    Vec2 perp = v.perpendicular();
    EXPECT_FLOAT_EQ(perp.x, -2.0f);
    EXPECT_FLOAT_EQ(perp.y, 1.0f);
}

// Test BallState
TEST(BallStateTest, Constructor) {
    BallState ball({1.0f, 2.0f}, {0.5f, 0.3f}, {0.1f, 0.2f}, 0.5f, true, 42);
    EXPECT_FLOAT_EQ(ball.position.x, 1.0f);
    EXPECT_FLOAT_EQ(ball.position.y, 2.0f);
    EXPECT_FLOAT_EQ(ball.velocity.x, 0.5f);
    EXPECT_FLOAT_EQ(ball.velocity.y, 0.3f);
    EXPECT_FLOAT_EQ(ball.angularVelocity.x, 0.1f);
    EXPECT_FLOAT_EQ(ball.angularVelocity.y, 0.2f);
    EXPECT_FLOAT_EQ(ball.radius, 0.5f);
    EXPECT_TRUE(ball.active);
    EXPECT_EQ(ball.id, 42);
}

// Test TrajectoryPoint
TEST(TrajectoryPointTest, Constructor) {
    TrajectoryPoint point({1.0f, 2.0f}, {0.5f, 0.3f}, 1.5f, true);
    EXPECT_FLOAT_EQ(point.position.x, 1.0f);
    EXPECT_FLOAT_EQ(point.position.y, 2.0f);
    EXPECT_FLOAT_EQ(point.velocity.x, 0.5f);
    EXPECT_FLOAT_EQ(point.velocity.y, 0.3f);
    EXPECT_FLOAT_EQ(point.time, 1.5f);
    EXPECT_TRUE(point.valid);
}

// Test PhysicsConfig
TEST(PhysicsConfigTest, DefaultValues) {
    PhysicsConfig config;
    EXPECT_FLOAT_EQ(config.tableWidth, TABLE_WIDTH);
    EXPECT_FLOAT_EQ(config.tableHeight, TABLE_HEIGHT);
    EXPECT_FLOAT_EQ(config.frictionCoefficient, FRICTION_COEFFICIENT);
    EXPECT_FLOAT_EQ(config.spinDecayRate, SPIN_DECAY_RATE);
    EXPECT_FLOAT_EQ(config.gravity, GRAVITY);
    EXPECT_FLOAT_EQ(config.timeStep, TIME_STEP);
    EXPECT_FLOAT_EQ(config.minVelocity, MIN_VELOCITY);
    EXPECT_EQ(config.maxTrajectoryPoints, 1000u);
}

} // namespace dojopool
