"""Script to run performance tests."""

import subprocess
import sys
import time
import json
from pathlib import Path
from datetime import datetime

def run_locust_test(duration_seconds=300, users=50, spawn_rate=5):
    """Run Locust load test.
    
    Args:
        duration_seconds (int): Test duration in seconds
        users (int): Number of users to simulate
        spawn_rate (int): Number of users to spawn per second
    """
    print(f"Starting load test with {users} users, spawn rate {spawn_rate}/s for {duration_seconds}s")
    
    # Create results directory if it doesn't exist
    results_dir = Path(__file__).parent / 'results'
    results_dir.mkdir(exist_ok=True)
    
    # Generate timestamp for this test run
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Run Locust in headless mode
    cmd = [
        "locust",
        "-f", str(Path(__file__).parent / "locustfile.py"),
        "--headless",
        "--users", str(users),
        "--spawn-rate", str(spawn_rate),
        "--run-time", f"{duration_seconds}s",
        "--csv", str(results_dir / f"results_{timestamp}"),
        "--host", "http://localhost:5000"  # Adjust host as needed
    ]
    
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print("Error running Locust:")
            print(stderr.decode())
            return False
        
        print("Load test completed successfully")
        return True
        
    except Exception as e:
        print(f"Error running load test: {e}")
        return False

def analyze_results(results_file):
    """Analyze test results and generate report.
    
    Args:
        results_file (Path): Path to CSV results file
    """
    import pandas as pd
    
    # Read results
    stats = pd.read_csv(results_file)
    
    # Calculate metrics
    metrics = {
        "total_requests": stats["Request Count"].sum(),
        "average_response_time": stats["Average Response Time"].mean(),
        "median_response_time": stats["Median Response Time"].mean(),
        "95th_percentile": stats["95%"].mean(),
        "requests_per_second": stats["Requests/s"].mean(),
        "failure_rate": (stats["Failure Count"].sum() / stats["Request Count"].sum()) * 100
    }
    
    # Generate report
    report = {
        "timestamp": datetime.now().isoformat(),
        "metrics": metrics,
        "summary": {
            "status": "pass" if metrics["failure_rate"] < 5 else "fail",
            "notes": []
        }
    }
    
    # Add analysis notes
    if metrics["average_response_time"] > 1000:
        report["summary"]["notes"].append("High average response time detected")
    if metrics["failure_rate"] > 1:
        report["summary"]["notes"].append("Significant failure rate detected")
    if metrics["requests_per_second"] < 10:
        report["summary"]["notes"].append("Low throughput detected")
    
    return report

def main():
    """Run performance tests and generate report."""
    # Run load test
    success = run_locust_test()
    if not success:
        sys.exit(1)
    
    # Find most recent results file
    results_dir = Path(__file__).parent / 'results'
    results_files = list(results_dir.glob('results_*.csv'))
    if not results_files:
        print("No results files found")
        sys.exit(1)
    
    latest_results = max(results_files, key=lambda p: p.stat().st_mtime)
    
    # Analyze results
    report = analyze_results(latest_results)
    
    # Save report
    report_file = results_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nPerformance test report saved to {report_file}")
    print("\nSummary:")
    print(f"Status: {report['summary']['status']}")
    for note in report['summary']['notes']:
        print(f"- {note}")

if __name__ == '__main__':
    main() 