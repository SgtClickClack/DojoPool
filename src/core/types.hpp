#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <memory>

namespace dojopool {

// Common type aliases
using String = std::string;
using StringView = std::string_view;

template<typename T>
using Vector = std::vector<T>;

template<typename T>
using UniquePtr = std::unique_ptr<T>;

template<typename T>
using SharedPtr = std::shared_ptr<T>;

// Common integer types
using int8 = std::int8_t;
using int16 = std::int16_t;
using int32 = std::int32_t;
using int64 = std::int64_t;

using uint8 = std::uint8_t;
using uint16 = std::uint16_t;
using uint32 = std::uint32_t;
using uint64 = std::uint64_t;

// Size type
using size_t = std::size_t;

// Result type for operations that can fail
template<typename T, typename E>
class Result {
public:
    Result(const T& value) : m_value(value), m_isError(false) {}
    Result(T&& value) : m_value(std::move(value)), m_isError(false) {}
    Result(const E& error) : m_error(error), m_isError(true) {}
    Result(E&& error) : m_error(std::move(error)), m_isError(true) {}

    bool isOk() const { return !m_isError; }
    bool isError() const { return m_isError; }

    const T& value() const { return m_value; }
    T& value() { return m_value; }

    const E& error() const { return m_error; }
    E& error() { return m_error; }

private:
    union {
        T m_value;
        E m_error;
    };
    bool m_isError;
};

// Optional type
template<typename T>
class Optional {
public:
    Optional() : m_hasValue(false) {}
    Optional(const T& value) : m_value(value), m_hasValue(true) {}
    Optional(T&& value) : m_value(std::move(value)), m_hasValue(true) {}

    bool hasValue() const { return m_hasValue; }
    explicit operator bool() const { return m_hasValue; }

    const T& value() const { return m_value; }
    T& value() { return m_value; }

    const T& operator*() const { return m_value; }
    T& operator*() { return m_value; }

private:
    union {
        T m_value;
    };
    bool m_hasValue;
};

} // namespace dojopool
