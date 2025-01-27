@echo off
cd /d %~dp0
python track_performance.py >> performance_tracking.log 2>&1 