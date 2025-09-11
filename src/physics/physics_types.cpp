#include "physics_types.hpp"
#include <cmath>

namespace dojopool {

// Vec2 implementation
float Vec2::length() const {
    return std::sqrt(x * x + y * y);
}

float Vec2::lengthSquared() const {
    return x * x + y * y;
}

Vec2 Vec2::normalized() const {
    float len = length();
    if (len == 0.0f) {
        return {0.0f, 0.0f};
    }
    return {x / len, y / len};
}

float Vec2::dot(const Vec2& other) const {
    return x * other.x + y * other.y;
}

Vec2 Vec2::perpendicular() const {
    return {-y, x};
}

} // namespace dojopool
