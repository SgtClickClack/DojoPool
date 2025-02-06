from typing import Dict, Any

def add_timeout_minutes(data: Dict[str, Any]) -> None:
    """Add timeout limits to jobs to prevent hanging."""
    if 'jobs' in data:
        for job_name, job in data['jobs'].items():
            if isinstance(job, dict) and 'timeout-minutes' not in job:
                job['timeout-minutes'] = 60  # Default 60 minute timeout 
