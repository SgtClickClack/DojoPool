#!/bin/bash
export PATH=/usr/local/bin:$PATH
# This script runs a load test on the Waitress server at http://localhost:8080
# Using 4 threads, 100 concurrent connections, for a duration of 30 seconds.
echo "Starting load test on http://localhost:8080..."
wrk -t4 -c100 -d30s http://localhost:8080
echo "Load test complete!"