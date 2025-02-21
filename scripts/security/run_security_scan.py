#!/usr/bin/env python3
"""Security scanning script for DojoPool."""

import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

def run_command(command: List[str], cwd: Optional[str] = None) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    return subprocess.run(
        command,
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False
    )

def run_bandit() -> Dict:
    """Run Bandit security static analysis."""
    print("Running Bandit security scan...")
    result = run_command([
        "bandit",
        "-r", "src/dojopool",
        "-f", "json",
        "-ll",  # Set to low level to catch all issues
        "--exclude", "tests,migrations"
    ])
    return json.loads(result.stdout) if result.stdout else {"errors": [result.stderr]}

def run_safety() -> Dict:
    """Check dependencies for known security issues."""
    print("Checking dependencies with Safety...")
    result = run_command(["safety", "check", "--json"])
    return json.loads(result.stdout) if result.stdout else {"errors": [result.stderr]}

def run_pip_audit() -> Dict:
    """Run pip-audit to check for dependency vulnerabilities."""
    print("Running pip-audit...")
    result = run_command(["pip-audit", "--format", "json"])
    return json.loads(result.stdout) if result.stdout else {"errors": [result.stderr]}

def run_detect_secrets() -> Dict:
    """Scan for hardcoded secrets."""
    print("Scanning for secrets with detect-secrets...")
    result = run_command(["detect-secrets", "scan", "--all-files"])
    return json.loads(result.stdout) if result.stdout else {"errors": [result.stderr]}

def run_semgrep() -> Dict:
    """Run Semgrep security rules."""
    print("Running Semgrep security scan...")
    result = run_command([
        "semgrep",
        "--config", "auto",
        "--json",
        "src/dojopool"
    ])
    return json.loads(result.stdout) if result.stdout else {"errors": [result.stderr]}

def run_owasp_check() -> Dict:
    """Run OWASP Dependency Check."""
    print("Running OWASP Dependency Check...")
    result = run_command([
        "dependency-check",
        "--scan", ".",
        "--format", "JSON",
        "--out", "security-reports/dependency-check-report.json"
    ])
    return {"status": "completed", "output": result.stdout, "errors": result.stderr}

def generate_report(results: Dict) -> None:
    """Generate a comprehensive security report."""
    report_dir = Path("security-reports")
    report_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = report_dir / f"security_report_{timestamp}.json"
    
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\nSecurity report generated: {report_path}")
    
    # Generate summary
    print("\nSecurity Scan Summary:")
    for tool, result in results.items():
        if "errors" in result and result["errors"]:
            print(f"⚠️ {tool}: Failed to run")
        else:
            print(f"✅ {tool}: Completed")

def main():
    """Run all security scans."""
    results = {
        "bandit": run_bandit(),
        "safety": run_safety(),
        "pip_audit": run_pip_audit(),
        "detect_secrets": run_detect_secrets(),
        "semgrep": run_semgrep(),
        "owasp_check": run_owasp_check()
    }
    
    generate_report(results)

if __name__ == "__main__":
    main() 