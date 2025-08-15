# Load test execution and analysis script for DojoPool
# This script runs k6 load tests and analyzes the results

# Get the directory where the script is located
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# Set up directories for results and analysis
$RESULTS_DIR = Join-Path $SCRIPT_DIR "..\load-tests\results"
$ANALYSIS_DIR = Join-Path $SCRIPT_DIR "..\load-tests\analysis"

# Create directories if they don't exist
New-Item -ItemType Directory -Force -Path $RESULTS_DIR | Out-Null
New-Item -ItemType Directory -Force -Path $ANALYSIS_DIR | Out-Null

# Get timestamp for unique file names
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "Starting load test execution..."

# Install k6 if not already installed
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Host "Installing k6..."
    choco install k6 -y
}

# Run k6 load test
try {
    $resultsFile = Join-Path $RESULTS_DIR "raw_results_$TIMESTAMP.json"
    $k6Args = @(
        "run",
        "--out", "json=$resultsFile",
        "--tag", "testid=$TIMESTAMP",
        "--env", "API_URL=http://localhost:3000",
        (Join-Path $SCRIPT_DIR "load-test.js")
    )
    
    Write-Host "Running k6 with arguments: $k6Args"
    & k6 $k6Args

    if ($LASTEXITCODE -ne 0) {
        Write-Host "k6 exited with code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "Error running k6 load test: $_"
    exit 1
}

Write-Host "Load test completed. Analyzing results..."

# Create Python script for analysis
$pythonScript = @"
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import requests
import os

# Read the results
results_file = r'$($resultsFile -replace '\\', '\\')'
print(f'Reading results from: {results_file}')

try:
    with open(results_file) as f:
        results = json.load(f)
except FileNotFoundError:
    print(f'Results file not found: {results_file}')
    exit(1)
except json.JSONDecodeError as e:
    print(f'Error decoding JSON from results file: {e}')
    exit(1)

# Create summary report
try:
    summary = {
        'total_requests': len(results.get('metrics', {}).get('http_reqs', [])),
        'error_rate': results.get('metrics', {}).get('http_req_failed', {}).get('values', {}).get('rate', 0) * 100,
        'avg_response_time': results.get('metrics', {}).get('http_req_duration', {}).get('values', {}).get('avg', 0),
        'p95_response_time': results.get('metrics', {}).get('http_req_duration', {}).get('values', {}).get('p(95)', 0),
        'game_startup_time_avg': results.get('metrics', {}).get('game_startup_time', {}).get('values', {}).get('avg', 0),
        'gameplay_latency_avg': results.get('metrics', {}).get('gameplay_latency', {}).get('values', {}).get('avg', 0),
        'matchmaking_time_avg': results.get('metrics', {}).get('matchmaking_time', {}).get('values', {}).get('avg', 0)
    }
except Exception as e:
    print(f'Error creating summary: {e}')
    exit(1)

# Create visualizations
try:
    plt.figure(figsize=(15, 10))

    # Response Time Distribution
    plt.subplot(2, 2, 1)
    response_times = results.get('metrics', {}).get('http_req_duration', {}).get('values', {}).get('samples', [])
    if response_times:
        sns.histplot(response_times)
        plt.title('Response Time Distribution')
        plt.xlabel('Response Time (ms)')

    # Error Rate Over Time
    plt.subplot(2, 2, 2)
    error_data = pd.DataFrame({
        'timestamp': results.get('metrics', {}).get('http_req_failed', {}).get('values', {}).get('timestamps', []),
        'error_rate': results.get('metrics', {}).get('http_req_failed', {}).get('values', {}).get('samples', [])
    })
    if not error_data.empty:
        sns.lineplot(data=error_data, x='timestamp', y='error_rate')
        plt.title('Error Rate Over Time')
        plt.xlabel('Time')
        plt.ylabel('Error Rate (%)')

    # Game Metrics Over Time
    plt.subplot(2, 2, 3)
    game_metrics = pd.DataFrame({
        'timestamp': results.get('metrics', {}).get('game_startup_time', {}).get('values', {}).get('timestamps', []),
        'startup_time': results.get('metrics', {}).get('game_startup_time', {}).get('values', {}).get('samples', []),
        'gameplay_latency': results.get('metrics', {}).get('gameplay_latency', {}).get('values', {}).get('samples', []),
        'matchmaking_time': results.get('metrics', {}).get('matchmaking_time', {}).get('values', {}).get('samples', [])
    })
    if not game_metrics.empty:
        sns.lineplot(data=game_metrics.melt('timestamp'), x='timestamp', y='value', hue='variable')
        plt.title('Game Metrics Over Time')
        plt.xlabel('Time')
        plt.ylabel('Time (ms)')

    # Save visualizations
    plt.tight_layout()
    analysis_file = r'$($ANALYSIS_DIR -replace '\\', '\\')/analysis_$TIMESTAMP.png'
    plt.savefig(analysis_file)
    print(f'Saved visualization to: {analysis_file}')
except Exception as e:
    print(f'Error creating visualizations: {e}')
    exit(1)

# Save summary report
try:
    report_file = r'$($ANALYSIS_DIR -replace '\\', '\\')/report_$TIMESTAMP.json'
    with open(report_file, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f'Saved report to: {report_file}')
except Exception as e:
    print(f'Error saving report: {e}')
    exit(1)

# Send results to Slack (if configured)
try:
    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
    if webhook_url:
        message = {
            'text': f'''Load Test Results Summary ($TIMESTAMP):
- Total Requests: {summary['total_requests']}
- Error Rate: {summary['error_rate']:.2f}%
- Avg Response Time: {summary['avg_response_time']:.2f}ms
- P95 Response Time: {summary['p95_response_time']:.2f}ms
- Avg Game Startup Time: {summary['game_startup_time_avg']:.2f}ms
- Avg Gameplay Latency: {summary['gameplay_latency_avg']:.2f}ms
- Avg Matchmaking Time: {summary['matchmaking_time_avg']:.2f}ms'''
        }
        requests.post(webhook_url, json=message)
        print('Sent results to Slack')
except Exception as e:
    print(f'Error sending results to Slack: {e}')
"@

# Save Python analysis script
$tempScriptPath = Join-Path $SCRIPT_DIR "temp_analysis.py"
$pythonScript | Out-File -Encoding UTF8 $tempScriptPath

# Run Python analysis
try {
    Write-Host "Running analysis script..."
    python $tempScriptPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Python script exited with code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "Error running analysis script: $_"
    exit 1
} finally {
    # Clean up temporary Python script
    if (Test-Path $tempScriptPath) {
        Remove-Item $tempScriptPath
    }
}

Write-Host "`nLoad test execution and analysis completed. Results available in:"
Write-Host "- Raw results: $resultsFile"
Write-Host "- Analysis report: $(Join-Path $ANALYSIS_DIR "report_$TIMESTAMP.json")"
Write-Host "- Visualizations: $(Join-Path $ANALYSIS_DIR "analysis_$TIMESTAMP.png")" 