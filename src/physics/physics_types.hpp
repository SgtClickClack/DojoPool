#pragma once

#include <cstdint>
#include <vector>

namespace dojopool {

// Physics constants
constexpr float TABLE_WIDTH = 9.0f;
constexpr float TABLE_HEIGHT = 4.5f;
constexpr float BALL_RADIUS = 0.028575f;
constexpr float FRICTION_COEFFICIENT = 0.02f;
constexpr float SPIN_DECAY_RATE = 0.98f;
constexpr float GRAVITY = 9.81f;
constexpr float TIME_STEP = 1.0f / 120.0f;
constexpr float MIN_VELOCITY = 0.001f;

// Vector2 structure for 2D coordinates and vectors
struct Vec2 {
    float x, y;

    Vec2(float x = 0.0f, float y = 0.0f) : x(x), y(y) {}

    Vec2 operator+(const Vec2& other) const { return {x + other.x, y + other.y}; }
    Vec2 operator-(const Vec2& other) const { return {x - other.x, y - other.y}; }
    Vec2 operator*(float scalar) const { return {x * scalar, y * scalar}; }
    Vec2 operator/(float scalar) const { return {x / scalar, y / scalar}; }

    Vec2& operator+=(const Vec2& other) { x += other.x; y += other.y; return *this; }
    Vec2& operator-=(const Vec2& other) { x -= other.x; y -= other.y; return *this; }
    Vec2& operator*=(float scalar) { x *= scalar; y *= scalar; return *this; }
    Vec2& operator/=(float scalar) { x /= scalar; y /= scalar; return *this; }

    float length() const;
    float lengthSquared() const;
    Vec2 normalized() const;
    float dot(const Vec2& other) const;
    Vec2 perpendicular() const;
};

// Ball state structure
struct BallState {
    Vec2 position;
    Vec2 velocity;
    Vec2 angularVelocity;
    float radius;
    bool active;
    int32_t id;

    BallState(Vec2 pos = {}, Vec2 vel = {}, Vec2 angVel = {},
              float rad = BALL_RADIUS, bool act = true, int32_t ballId = 0)
        : position(pos), velocity(vel), angularVelocity(angVel),
          radius(rad), active(act), id(ballId) {}
};

// Trajectory point for ball path prediction
struct TrajectoryPoint {
    Vec2 position;
    Vec2 velocity;
    float time;
    bool valid;

    TrajectoryPoint(Vec2 pos = {}, Vec2 vel = {}, float t = 0.0f, bool v = true)
        : position(pos), velocity(vel), time(t), valid(v) {}
};

// Collision result information
struct CollisionResult {
    bool collided;
    float timeToCollision;
    int32_t ballA;
    int32_t ballB;
    Vec2 contactPoint;

    CollisionResult(bool c = false, float t = 0.0f, int32_t a = -1, int32_t b = -1, Vec2 contact = {})
        : collided(c), timeToCollision(t), ballA(a), ballB(b), contactPoint(contact) {}
};

// Physics simulation configuration
struct PhysicsConfig {
    float tableWidth;
    float tableHeight;
    float frictionCoefficient;
    float spinDecayRate;
    float gravity;
    float timeStep;
    float minVelocity;
    uint32_t maxTrajectoryPoints;

    PhysicsConfig(float width = TABLE_WIDTH, float height = TABLE_HEIGHT,
                  float friction = FRICTION_COEFFICIENT, float spinDecay = SPIN_DECAY_RATE,
                  float grav = GRAVITY, float step = TIME_STEP, float minVel = MIN_VELOCITY,
                  uint32_t maxPoints = 1000)
        : tableWidth(width), tableHeight(height), frictionCoefficient(friction),
          spinDecayRate(spinDecay), gravity(grav), timeStep(step), minVelocity(minVel),
          maxTrajectoryPoints(maxPoints) {}
};

// Type aliases for collections
using BallStates = std::vector<BallState>;
using Trajectory = std::vector<TrajectoryPoint>;

} // namespace dojopool
