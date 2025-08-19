#!/bin/bash

# Load test execution and analysis script for DojoPool
# This script runs k6 load tests and analyzes the results

# Load environment variables
source ../.env.staging

# Set directories
SCRIPT_DIR="$(dirname "$0")"
RESULTS_DIR="$SCRIPT_DIR/../load-tests/results"
ANALYSIS_DIR="$SCRIPT_DIR/../load-tests/analysis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create directories if they don't exist
mkdir -p "$RESULTS_DIR"
mkdir -p "$ANALYSIS_DIR"

echo "Starting load tests at $TIMESTAMP"

# Run k6 load tests and save results
k6 run \
  --out json="$RESULTS_DIR/raw_results_$TIMESTAMP.json" \
  --out influxdb="$INFLUXDB_URL" \
  --tag testid="$TIMESTAMP" \
  "$SCRIPT_DIR/load-test.js"

# Wait for InfluxDB to process the data
sleep 10

# Generate analysis report using Python
python3 << END
import json
import pandas as pd
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

# Load test results
with open('$RESULTS_DIR/raw_results_$TIMESTAMP.json') as f:
    results = json.load(f)

# Create analysis report
report = {
    'timestamp': '$TIMESTAMP',
    'summary': {
        'total_requests': len(results['metrics']['http_reqs']),
        'error_rate': results['metrics']['http_req_failed']['rate'],
        'avg_response_time': results['metrics']['http_req_duration']['avg'],
        'p95_response_time': results['metrics']['http_req_duration']['p95'],
        'game_startup_p95': results['metrics']['game_startup_time']['p95'],
        'matchmaking_p95': results['metrics']['matchmaking_time']['p95'],
        'gameplay_latency_p95': results['metrics']['gameplay_latency']['p95']
    },
    'thresholds': {
        'passed': all(t['ok'] for t in results['thresholds'].values()),
        'details': {name: t['ok'] for name, t in results['thresholds'].items()}
    }
}

# Create visualizations
plt.figure(figsize=(15, 10))

# Response time distribution
plt.subplot(2, 2, 1)
sns.histplot(results['metrics']['http_req_duration']['values'])
plt.title('Response Time Distribution')
plt.xlabel('Response Time (ms)')

# Error rate over time
plt.subplot(2, 2, 2)
sns.lineplot(data=results['metrics']['errors']['values'])
plt.title('Error Rate Over Time')
plt.xlabel('Time')
plt.ylabel('Error Rate')

# Save visualizations
plt.savefig('$ANALYSIS_DIR/analysis_$TIMESTAMP.png')

# Save report
with open('$ANALYSIS_DIR/report_$TIMESTAMP.json', 'w') as f:
    json.dump(report, f, indent=2)

# Print summary
print("\nLoad Test Analysis Summary")
print("==========================")
print(f"Total Requests: {report['summary']['total_requests']}")
print(f"Error Rate: {report['summary']['error_rate']:.2%}")
print(f"Avg Response Time: {report['summary']['avg_response_time']:.2f}ms")
print(f"P95 Response Time: {report['summary']['p95_response_time']:.2f}ms")
print(f"All Thresholds Passed: {'Yes' if report['thresholds']['passed'] else 'No'}")

# Send results to Slack
import requests
requests.post('$SLACK_WEBHOOK_URL', json={
    'text': f"""
Load Test Results ($TIMESTAMP)
• Total Requests: {report['summary']['total_requests']}
• Error Rate: {report['summary']['error_rate']:.2%}
• P95 Response Time: {report['summary']['p95_response_time']:.2f}ms
• Thresholds Passed: {'✅' if report['thresholds']['passed'] else '❌'}
"""
})
END

# Update Grafana dashboard with latest results
curl -X POST "$GRAFANA_API_URL/api/dashboards/db" \
  -H "Authorization: Bearer $GRAFANA_API_KEY" \
  -H "Content-Type: application/json" \
  --data @- << EOF
{
  "dashboard": {
    "id": null,
    "title": "Load Test Results - $TIMESTAMP",
    "tags": ["load-test"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Response Time Distribution",
        "type": "graph",
        "datasource": "InfluxDB",
        "targets": [
          {
            "query": "SELECT mean(\"value\") FROM \"http_req_duration\" WHERE \"testid\" = '$TIMESTAMP' GROUP BY time(10s)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "InfluxDB",
        "targets": [
          {
            "query": "SELECT mean(\"value\") FROM \"errors\" WHERE \"testid\" = '$TIMESTAMP' GROUP BY time(10s)"
          }
        ]
      }
    ]
  }
}
EOF

echo "Load test execution and analysis completed. Results available in:"
echo "- Raw results: $RESULTS_DIR/raw_results_$TIMESTAMP.json"
echo "- Analysis report: $ANALYSIS_DIR/report_$TIMESTAMP.json"
echo "- Visualizations: $ANALYSIS_DIR/analysis_$TIMESTAMP.png"
echo "- Grafana dashboard updated" 