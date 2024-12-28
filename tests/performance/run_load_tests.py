#!/usr/bin/env python3
"""Script to run load tests and collect metrics."""

import subprocess
import time
import json
import os
import sys
import requests
from datetime import datetime

def setup_test_environment():
    """Prepare the test environment."""
    print("Setting up test environment...")
    
    # Ensure required directories exist
    os.makedirs("results", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Check if services are running
    try:
        response = requests.get("http://localhost/health")
        if response.status_code != 200:
            print("Error: Application is not healthy")
            sys.exit(1)
    except requests.exceptions.RequestException:
        print("Error: Application is not accessible")
        sys.exit(1)

def run_load_test(duration, users, spawn_rate):
    """Run load test with specified parameters."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"results/load_test_{timestamp}.json"
    log_file = f"logs/load_test_{timestamp}.log"
    
    print(f"Starting load test with {users} users, spawn rate {spawn_rate}/s for {duration} seconds")
    
    # Start Locust in headless mode
    cmd = [
        "locust",
        "-f", "locustfile.py",
        "--headless",
        "--users", str(users),
        "--spawn-rate", str(spawn_rate),
        "--run-time", f"{duration}s",
        "--host", "http://localhost",
        "--csv", f"results/load_test_{timestamp}",
        "--json"
    ]
    
    with open(log_file, "w") as f:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        # Stream output to both console and log file
        for line in process.stdout:
            print(line, end="")
            f.write(line)
            f.flush()
        
        process.wait()
    
    return results_file, log_file

def collect_metrics():
    """Collect metrics from Prometheus."""
    try:
        # Query Prometheus for relevant metrics
        metrics = {
            "http_request_duration_seconds": requests.get(
                "http://localhost:9090/api/v1/query",
                params={
                    "query": "rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])"
                }
            ).json(),
            "cpu_usage": requests.get(
                "http://localhost:9090/api/v1/query",
                params={
                    "query": "rate(process_cpu_seconds_total[5m]) * 100"
                }
            ).json(),
            "memory_usage": requests.get(
                "http://localhost:9090/api/v1/query",
                params={
                    "query": "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes"
                }
            ).json(),
            "error_rate": requests.get(
                "http://localhost:9090/api/v1/query",
                params={
                    "query": 'rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100'
                }
            ).json()
        }
        return metrics
    except requests.exceptions.RequestException as e:
        print(f"Error collecting metrics: {e}")
        return None

def analyze_results(results_file, metrics):
    """Analyze test results and metrics."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    analysis_file = f"results/analysis_{timestamp}.json"
    
    # Load test results
    with open(results_file, "r") as f:
        results = json.load(f)
    
    # Perform analysis
    analysis = {
        "timestamp": timestamp,
        "summary": {
            "total_requests": results.get("total_requests", 0),
            "success_rate": results.get("success_rate", 0),
            "average_response_time": results.get("average_response_time", 0),
            "requests_per_second": results.get("requests_per_second", 0)
        },
        "metrics": metrics,
        "thresholds": {
            "response_time": {
                "passed": results.get("average_response_time", float("inf")) < 1000,
                "threshold": 1000,
                "actual": results.get("average_response_time", 0)
            },
            "error_rate": {
                "passed": results.get("error_rate", float("inf")) < 5,
                "threshold": 5,
                "actual": results.get("error_rate", 0)
            },
            "success_rate": {
                "passed": results.get("success_rate", 0) > 95,
                "threshold": 95,
                "actual": results.get("success_rate", 0)
            }
        }
    }
    
    # Save analysis
    with open(analysis_file, "w") as f:
        json.dump(analysis, f, indent=2)
    
    return analysis

def main():
    """Main function to run load tests."""
    try:
        setup_test_environment()
        
        # Define test scenarios
        scenarios = [
            {"users": 10, "spawn_rate": 1, "duration": 60},  # Warm-up
            {"users": 50, "spawn_rate": 5, "duration": 300},  # Normal load
            {"users": 100, "spawn_rate": 10, "duration": 300},  # High load
            {"users": 200, "spawn_rate": 20, "duration": 300}  # Peak load
        ]
        
        for scenario in scenarios:
            print(f"\nRunning scenario: {scenario}")
            results_file, log_file = run_load_test(**scenario)
            
            print("\nCollecting metrics...")
            metrics = collect_metrics()
            
            print("\nAnalyzing results...")
            analysis = analyze_results(results_file, metrics)
            
            # Print summary
            print("\nTest Summary:")
            print(f"Total Requests: {analysis['summary']['total_requests']}")
            print(f"Success Rate: {analysis['summary']['success_rate']}%")
            print(f"Average Response Time: {analysis['summary']['average_response_time']}ms")
            print(f"Requests/Second: {analysis['summary']['requests_per_second']}")
            
            # Check thresholds
            failed_thresholds = [
                k for k, v in analysis["thresholds"].items() if not v["passed"]
            ]
            
            if failed_thresholds:
                print("\nWarning: The following thresholds were exceeded:")
                for threshold in failed_thresholds:
                    print(f"- {threshold}: {analysis['thresholds'][threshold]}")
            else:
                print("\nAll thresholds passed!")
            
            # Wait between scenarios
            if scenario != scenarios[-1]:
                print("\nWaiting 60 seconds before next scenario...")
                time.sleep(60)
        
        print("\nLoad testing completed successfully!")
        
    except Exception as e:
        print(f"Error during load testing: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 