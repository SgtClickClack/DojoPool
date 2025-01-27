@echo off
cd /d %~dp0

REM Run performance tracking
python track_performance.py >> performance_tracking.log 2>&1

REM Run performance monitoring
python monitor_performance.py >> performance_monitoring.log 2>&1 