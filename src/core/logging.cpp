#include "logging.hpp"
#include <chrono>
#include <ctime>
#include <iomanip>

namespace dojopool {

Logger& Logger::getInstance() {
    static Logger instance;
    return instance;
}

Logger::Logger()
    : m_minLevel(LogLevel::INFO),
      m_outputStream(&std::cout) {
}

void Logger::setLogLevel(LogLevel level) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_minLevel = level;
}

void Logger::log(LogLevel level, const String& message, const String& source) {
    if (level < m_minLevel) {
        return;
    }

    std::lock_guard<std::mutex> lock(m_mutex);

    String timestamp = getCurrentTimestamp();
    String levelStr = levelToString(level);

    *m_outputStream << "[" << timestamp << "] "
                    << "[" << levelStr << "] ";

    if (!source.empty()) {
        *m_outputStream << "[" << source << "] ";
    }

    *m_outputStream << message << std::endl;
}

void Logger::debug(const String& message, const String& source) {
    log(LogLevel::DEBUG, message, source);
}

void Logger::info(const String& message, const String& source) {
    log(LogLevel::INFO, message, source);
}

void Logger::warning(const String& message, const String& source) {
    log(LogLevel::WARNING, message, source);
}

void Logger::error(const String& message, const String& source) {
    log(LogLevel::ERROR, message, source);
}

void Logger::critical(const String& message, const String& source) {
    log(LogLevel::CRITICAL, message, source);
}

String Logger::getCurrentTimestamp() const {
    auto now = std::chrono::system_clock::now();
    auto time = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;

    std::stringstream ss;
    ss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S")
       << '.' << std::setfill('0') << std::setw(3) << ms.count();

    return ss.str();
}

String Logger::levelToString(LogLevel level) const {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO: return "INFO";
        case LogLevel::WARNING: return "WARNING";
        case LogLevel::ERROR: return "ERROR";
        case LogLevel::CRITICAL: return "CRITICAL";
        default: return "UNKNOWN";
    }
}

} // namespace dojopool
