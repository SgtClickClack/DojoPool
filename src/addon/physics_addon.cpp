/**
 * DojoPool Physics Engine Node.js Addon
 *
 * This addon provides a JavaScript interface to the C++ physics engine,
 * enabling real-time physics calculations within the NestJS backend.
 */

#include <napi.h>
#include "pool_physics.hpp"
#include <memory>
#include <vector>

namespace dojopool_addon {

// Physics engine wrapper class for Node.js
class PhysicsAddon : public Napi::ObjectWrap<PhysicsAddon> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    PhysicsAddon(const Napi::CallbackInfo& info);

private:
    // Instance methods
    Napi::Value AddBall(const Napi::CallbackInfo& info);
    Napi::Value ClearBalls(const Napi::CallbackInfo& info);
    Napi::Value SimulateStep(const Napi::CallbackInfo& info);
    Napi::Value GetBallStates(const Napi::CallbackInfo& info);
    Napi::Value CalculateTrajectory(const Napi::CallbackInfo& info);
    Napi::Value CalculateShot(const Napi::CallbackInfo& info);
    Napi::Value CalculateBankShot(const Napi::CallbackInfo& info);

    // Helper methods
    Napi::Object ConvertBallStateToJS(Napi::Env env, const dojopool::BallState& ball);
    dojopool::Vec2 ConvertJSToVec2(Napi::Value jsValue);
    dojopool::BallState ConvertJSToBallState(Napi::Value jsValue);
    Napi::Array ConvertTrajectoryToJS(Napi::Env env, const dojopool::Trajectory& trajectory);

    std::unique_ptr<dojopool::PoolPhysicsEngine> m_physicsEngine;
};

Napi::Object PhysicsAddon::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "PhysicsAddon", {
        InstanceMethod("addBall", &PhysicsAddon::AddBall),
        InstanceMethod("clearBalls", &PhysicsAddon::ClearBalls),
        InstanceMethod("simulateStep", &PhysicsAddon::SimulateStep),
        InstanceMethod("getBallStates", &PhysicsAddon::GetBallStates),
        InstanceMethod("calculateTrajectory", &PhysicsAddon::CalculateTrajectory),
        InstanceMethod("calculateShot", &PhysicsAddon::CalculateShot),
        InstanceMethod("calculateBankShot", &PhysicsAddon::CalculateBankShot),
    });

    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);
    env.SetInstanceData(constructor);

    exports.Set("PhysicsAddon", func);
    return exports;
}

PhysicsAddon::PhysicsAddon(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<PhysicsAddon>(info) {
    Napi::Env env = info.Env();

    // Parse configuration from JavaScript
    dojopool::PhysicsConfig config;

    if (info.Length() > 0 && info[0].IsObject()) {
        Napi::Object jsConfig = info[0].As<Napi::Object>();

        if (jsConfig.Has("tableWidth") && jsConfig.Get("tableWidth").IsNumber()) {
            config.tableWidth = jsConfig.Get("tableWidth").As<Napi::Number>().FloatValue();
        }
        if (jsConfig.Has("tableHeight") && jsConfig.Get("tableHeight").IsNumber()) {
            config.tableHeight = jsConfig.Get("tableHeight").As<Napi::Number>().FloatValue();
        }
        if (jsConfig.Has("frictionCoefficient") && jsConfig.Get("frictionCoefficient").IsNumber()) {
            config.frictionCoefficient = jsConfig.Get("frictionCoefficient").As<Napi::Number>().FloatValue();
        }
        if (jsConfig.Has("timeStep") && jsConfig.Get("timeStep").IsNumber()) {
            config.timeStep = jsConfig.Get("timeStep").As<Napi::Number>().FloatValue();
        }
    }

    m_physicsEngine = std::make_unique<dojopool::PoolPhysicsEngine>(config);
}

Napi::Value PhysicsAddon::AddBall(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected at least 4 arguments: position, velocity, angularVelocity, id")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        dojopool::Vec2 position = ConvertJSToVec2(info[0]);
        dojopool::Vec2 velocity = ConvertJSToVec2(info[1]);
        dojopool::Vec2 angularVelocity = ConvertJSToVec2(info[2]);

        int32_t id = info[3].As<Napi::Number>().Int32Value();

        m_physicsEngine->addBall(position, velocity, angularVelocity, id);

        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to add ball: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value PhysicsAddon::ClearBalls(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    try {
        m_physicsEngine->clearBalls();
        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to clear balls: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value PhysicsAddon::SimulateStep(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected a number argument for deltaTime")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        float deltaTime = info[0].As<Napi::Number>().FloatValue();
        m_physicsEngine->simulateStep(deltaTime);

        return env.Undefined();
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to simulate step: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value PhysicsAddon::GetBallStates(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    try {
        const auto& ballStates = m_physicsEngine->getBallStates();
        Napi::Array jsArray = Napi::Array::New(env, ballStates.size());

        for (size_t i = 0; i < ballStates.size(); ++i) {
            jsArray.Set(i, ConvertBallStateToJS(env, ballStates[i]));
        }

        return jsArray;
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to get ball states: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value PhysicsAddon::CalculateTrajectory(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected a number argument for ballId")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        int32_t ballId = info[0].As<Napi::Number>().Int32Value();
        float maxTime = 10.0f;

        if (info.Length() > 1 && info[1].IsNumber()) {
            maxTime = info[1].As<Napi::Number>().FloatValue();
        }

        dojopool::Trajectory trajectory = m_physicsEngine->calculateTrajectory(ballId, maxTime);

        return ConvertTrajectoryToJS(env, trajectory);
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to calculate trajectory: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value PhysicsAddon::CalculateShot(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected 4 arguments: start, target, power, spinX, spinY")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        dojopool::Vec2 start = ConvertJSToVec2(info[0]);
        dojopool::Vec2 target = ConvertJSToVec2(info[1]);
        float power = info[2].As<Napi::Number>().FloatValue();
        float spinX = info[3].As<Napi::Number>().FloatValue();
        float spinY = info[4].As<Napi::Number>().FloatValue();

        dojopool::TrajectoryPoint result = m_physicsEngine->calculateShot(start, target, power, spinX, spinY);

        Napi::Object jsResult = Napi::Object::New(env);
        jsResult.Set("x", Napi::Number::New(env, result.position.x));
        jsResult.Set("y", Napi::Number::New(env, result.position.y));
        jsResult.Set("vx", Napi::Number::New(env, result.velocity.x));
        jsResult.Set("vy", Napi::Number::New(env, result.velocity.y));
        jsResult.Set("time", Napi::Number::New(env, result.time));
        jsResult.Set("valid", Napi::Boolean::New(env, result.valid));

        return jsResult;
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to calculate shot: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

Napi::Value PhysicsAddon::CalculateBankShot(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 6) {
        Napi::TypeError::New(env, "Expected 6 arguments: start, cushion, target, power, spinX, spinY")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    try {
        dojopool::Vec2 start = ConvertJSToVec2(info[0]);
        dojopool::Vec2 cushion = ConvertJSToVec2(info[1]);
        dojopool::Vec2 target = ConvertJSToVec2(info[2]);
        float power = info[3].As<Napi::Number>().FloatValue();
        float spinX = info[4].As<Napi::Number>().FloatValue();
        float spinY = info[5].As<Napi::Number>().FloatValue();

        dojopool::Trajectory trajectory = m_physicsEngine->calculateBankShot(start, cushion, target, power, spinX, spinY);

        return ConvertTrajectoryToJS(env, trajectory);
    } catch (const std::exception& e) {
        Napi::Error::New(env, std::string("Failed to calculate bank shot: ") + e.what())
            .ThrowAsJavaScriptException();
        return env.Null();
    }
}

// Helper method implementations
Napi::Object PhysicsAddon::ConvertBallStateToJS(Napi::Env env, const dojopool::BallState& ball) {
    Napi::Object jsBall = Napi::Object::New(env);

    // Position
    Napi::Object position = Napi::Object::New(env);
    position.Set("x", Napi::Number::New(env, ball.position.x));
    position.Set("y", Napi::Number::New(env, ball.position.y));
    jsBall.Set("position", position);

    // Velocity
    Napi::Object velocity = Napi::Object::New(env);
    velocity.Set("x", Napi::Number::New(env, ball.velocity.x));
    velocity.Set("y", Napi::Number::New(env, ball.velocity.y));
    jsBall.Set("velocity", velocity);

    // Angular velocity
    Napi::Object angularVelocity = Napi::Object::New(env);
    angularVelocity.Set("x", Napi::Number::New(env, ball.angularVelocity.x));
    angularVelocity.Set("y", Napi::Number::New(env, ball.angularVelocity.y));
    jsBall.Set("angularVelocity", angularVelocity);

    // Other properties
    jsBall.Set("radius", Napi::Number::New(env, ball.radius));
    jsBall.Set("active", Napi::Boolean::New(env, ball.active));
    jsBall.Set("id", Napi::Number::New(env, ball.id));

    return jsBall;
}

dojopool::Vec2 PhysicsAddon::ConvertJSToVec2(Napi::Value jsValue) {
    if (!jsValue.IsObject()) {
        throw std::runtime_error("Expected an object with x and y properties");
    }

    Napi::Object jsObj = jsValue.As<Napi::Object>();

    if (!jsObj.Has("x") || !jsObj.Has("y")) {
        throw std::runtime_error("Object must have x and y properties");
    }

    float x = jsObj.Get("x").As<Napi::Number>().FloatValue();
    float y = jsObj.Get("y").As<Napi::Number>().FloatValue();

    return dojopool::Vec2(x, y);
}

dojopool::BallState PhysicsAddon::ConvertJSToBallState(Napi::Value jsValue) {
    if (!jsValue.IsObject()) {
        throw std::runtime_error("Expected an object representing a ball state");
    }

    Napi::Object jsObj = jsValue.As<Napi::Object>();

    dojopool::Vec2 position = ConvertJSToVec2(jsObj.Get("position"));
    dojopool::Vec2 velocity = ConvertJSToVec2(jsObj.Get("velocity"));
    dojopool::Vec2 angularVelocity = ConvertJSToVec2(jsObj.Get("angularVelocity"));

    float radius = jsObj.Get("radius").As<Napi::Number>().FloatValue();
    bool active = jsObj.Get("active").As<Napi::Boolean>().Value();
    int32_t id = jsObj.Get("id").As<Napi::Number>().Int32Value();

    return dojopool::BallState(position, velocity, angularVelocity, radius, active, id);
}

Napi::Array PhysicsAddon::ConvertTrajectoryToJS(Napi::Env env, const dojopool::Trajectory& trajectory) {
    Napi::Array jsArray = Napi::Array::New(env, trajectory.size());

    for (size_t i = 0; i < trajectory.size(); ++i) {
        const auto& point = trajectory[i];
        Napi::Object jsPoint = Napi::Object::New(env);

        // Position
        Napi::Object position = Napi::Object::New(env);
        position.Set("x", Napi::Number::New(env, point.position.x));
        position.Set("y", Napi::Number::New(env, point.position.y));
        jsPoint.Set("position", position);

        // Velocity
        Napi::Object velocity = Napi::Object::New(env);
        velocity.Set("x", Napi::Number::New(env, point.velocity.x));
        velocity.Set("y", Napi::Number::New(env, point.velocity.y));
        jsPoint.Set("velocity", velocity);

        // Other properties
        jsPoint.Set("time", Napi::Number::New(env, point.time));
        jsPoint.Set("valid", Napi::Boolean::New(env, point.valid));

        jsArray.Set(i, jsPoint);
    }

    return jsArray;
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    return PhysicsAddon::Init(env, exports);
}

NODE_API_MODULE(dojopool_physics, Init)

} // namespace dojopool_addon
