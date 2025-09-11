#pragma once

#include "types.hpp"
#include <iostream>
#include <sstream>
#include <mutex>

namespace dojopool {

// Log levels
enum class LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
    CRITICAL
};

// Log entry structure
struct LogEntry {
    LogLevel level;
    String message;
    String timestamp;
    String source;
};

/**
 * @brief Thread-safe logging system for DojoPool
 */
class Logger {
public:
    static Logger& getInstance();

    // Prevent copying and moving
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;
    Logger(Logger&&) = delete;
    Logger& operator=(Logger&&) = delete;

    /**
     * @brief Set minimum log level
     * @param level Minimum level to log
     */
    void setLogLevel(LogLevel level);

    /**
     * @brief Log a message
     * @param level Log level
     * @param message Message to log
     * @param source Source of the log message
     */
    void log(LogLevel level, const String& message, const String& source = "");

    /**
     * @brief Log debug message
     * @param message Debug message
     * @param source Source of the message
     */
    void debug(const String& message, const String& source = "");

    /**
     * @brief Log info message
     * @param message Info message
     * @param source Source of the message
     */
    void info(const String& message, const String& source = "");

    /**
     * @brief Log warning message
     * @param message Warning message
     * @param source Source of the message
     */
    void warning(const String& message, const String& source = "");

    /**
     * @brief Log error message
     * @param message Error message
     * @param source Source of the message
     */
    void error(const String& message, const String& source = "");

    /**
     * @brief Log critical message
     * @param message Critical message
     * @param source Source of the message
     */
    void critical(const String& message, const String& source = "");

private:
    Logger();
    ~Logger() = default;

    LogLevel m_minLevel;
    std::mutex m_mutex;
    std::ostream* m_outputStream;

    String getCurrentTimestamp() const;
    String levelToString(LogLevel level) const;
};

// Convenience macros for logging
#define DOJO_LOG_DEBUG(msg) dojopool::Logger::getInstance().debug(msg, __FUNCTION__)
#define DOJO_LOG_INFO(msg) dojopool::Logger::getInstance().info(msg, __FUNCTION__)
#define DOJO_LOG_WARNING(msg) dojopool::Logger::getInstance().warning(msg, __FUNCTION__)
#define DOJO_LOG_ERROR(msg) dojopool::Logger::getInstance().error(msg, __FUNCTION__)
#define DOJO_LOG_CRITICAL(msg) dojopool::Logger::getInstance().critical(msg, __FUNCTION__)

} // namespace dojopool
