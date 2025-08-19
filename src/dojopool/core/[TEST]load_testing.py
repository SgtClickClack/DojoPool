"""Load testing module for DojoPool."""

import logging
import random
import statistics
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


@dataclass
class RequestResult:
    """Request result data structure."""

    endpoint: str
    method: str
    status_code: int
    response_time: float
    timestamp: datetime
    success: bool
    error: Optional[str] = None


class LoadTest:
    """Load test configuration and execution."""

    def __init__(
        self,
        base_url: str,
        endpoints: List[Dict[str, Any]],
        users: int = 10,
        duration: int = 60,
        ramp_up: int = 0,
    ):
        """Initialize LoadTest.

        Args:
            base_url: Base URL for requests
            endpoints: List of endpoint configurations
            users: Number of concurrent users
            duration: Test duration in seconds
            ramp_up: Ramp up period in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.endpoints = endpoints
        self.users = users
        self.duration = duration
        self.ramp_up = ramp_up

        self.results: List[RequestResult] = []
        self._lock = threading.Lock()
        self._stop_event = threading.Event()

    def execute(self) -> Dict[str, Any]:
        """Execute load test.

        Returns:
            Test results summary
        """
        logger.info(f"Starting load test with {self.users} users for {self.duration}s")

        # Calculate delay between user starts for ramp up
        start_delay = self.ramp_up / self.users if self.ramp_up > 0 else 0

        # Start user threads
        with ThreadPoolExecutor(max_workers=self.users) as executor:
            futures = []
            for i in range(self.users):
                future = executor.submit(self._user_session, i, start_delay * i)
                futures.append(future)

            # Wait for completion
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"User session error: {str(e)}")

        # Generate summary
        return self._generate_summary()

    def _user_session(self, user_id: int, start_delay: float):
        """Simulate user session.

        Args:
            user_id: User identifier
            start_delay: Delay before starting requests
        """
        # Wait for start delay
        if start_delay > 0:
            time.sleep(start_delay)

        session = requests.Session()
        start_time = time.time()

        while not self._stop_event.is_set() and time.time() - start_time < self.duration:
            # Select random endpoint
            endpoint = random.choice(self.endpoints)

            try:
                # Prepare request
                url = f"{self.base_url}{endpoint['path']}"
                method = endpoint.get("method", "GET")
                headers = endpoint.get("headers", {})
                data = endpoint.get("data")

                # Add authentication if needed
                if endpoint.get("auth"):
                    headers["Authorization"] = f"Bearer {self._get_auth_token()}"

                # Execute request
                start = time.time()
                response = session.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=data if method in ["POST", "PUT", "PATCH"] else None,
                )
                duration = time.time() - start

                # Record result
                result = RequestResult(
                    endpoint=endpoint["path"],
                    method=method,
                    status_code=response.status_code,
                    response_time=duration,
                    timestamp=datetime.utcnow(),
                    success=response.status_code < 400,
                )

            except Exception as e:
                # Record error
                result = RequestResult(
                    endpoint=endpoint["path"],
                    method=method,
                    status_code=0,
                    response_time=time.time() - start,
                    timestamp=datetime.utcnow(),
                    success=False,
                    error=str(e),
                )

            with self._lock:
                self.results.append(result)

            # Wait for think time
            think_time = random.uniform(
                endpoint.get("min_think_time", 1), endpoint.get("max_think_time", 5)
            )
            time.sleep(think_time)

    def _generate_summary(self) -> Dict[str, Any]:
        """Generate test results summary.

        Returns:
            Summary dictionary
        """
        summary = {
            "total_requests": len(self.results),
            "success_rate": 0,
            "total_duration": self.duration,
            "total_users": self.users,
            "endpoints": {},
            "response_times": {"min": 0, "max": 0, "avg": 0, "median": 0, "p95": 0, "p99": 0},
        }

        if not self.results:
            return summary

        # Calculate success rate
        successful = sum(1 for r in self.results if r.success)
        summary["success_rate"] = (successful / len(self.results)) * 100

        # Group by endpoint
        endpoint_results: Dict[str, List[RequestResult]] = {}
        for result in self.results:
            key = f"{result.method} {result.endpoint}"
            if key not in endpoint_results:
                endpoint_results[key] = []
            endpoint_results[key].append(result)

        # Calculate endpoint statistics
        for endpoint, results in endpoint_results.items():
            response_times = [r.response_time for r in results]
            successful = sum(1 for r in results if r.success)

            summary["endpoints"][endpoint] = {
                "total_requests": len(results),
                "success_rate": (successful / len(results)) * 100,
                "response_times": {
                    "min": min(response_times),
                    "max": max(response_times),
                    "avg": statistics.mean(response_times),
                    "median": statistics.median(response_times),
                    "p95": statistics.quantiles(response_times, n=20)[-1],
                    "p99": statistics.quantiles(response_times, n=100)[-1],
                },
            }

        # Calculate overall statistics
        all_response_times = [r.response_time for r in self.results]
        summary["response_times"] = {
            "min": min(all_response_times),
            "max": max(all_response_times),
            "avg": statistics.mean(all_response_times),
            "median": statistics.median(all_response_times),
            "p95": statistics.quantiles(all_response_times, n=20)[-1],
            "p99": statistics.quantiles(all_response_times, n=100)[-1],
        }

        return summary

    def _get_auth_token(self) -> str:
        """Get authentication token.

        Returns:
            Authentication token
        """
        # TODO: Implement token generation/retrieval
        return "test-token"


class LoadTestRunner:
    """Load test runner with different scenarios."""

    def __init__(self, base_url: str):
        """Initialize LoadTestRunner.

        Args:
            base_url: Base URL for requests
        """
        self.base_url = base_url
        self.results: List[Dict[str, Any]] = []

    def run_smoke_test(self, endpoints: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run smoke test with minimal load.

        Args:
            endpoints: List of endpoint configurations

        Returns:
            Test results
        """
        test = LoadTest(
            base_url=self.base_url, endpoints=endpoints, users=1, duration=60, ramp_up=0
        )
        results = test.execute()
        self.results.append(
            {"type": "smoke", "timestamp": datetime.utcnow().isoformat(), "results": results}
        )
        return results

    def run_load_test(
        self,
        endpoints: List[Dict[str, Any]],
        users: int = 10,
        duration: int = 300,
        ramp_up: int = 30,
    ) -> Dict[str, Any]:
        """Run load test with sustained load.

        Args:
            endpoints: List of endpoint configurations
            users: Number of concurrent users
            duration: Test duration in seconds
            ramp_up: Ramp up period in seconds

        Returns:
            Test results
        """
        test = LoadTest(
            base_url=self.base_url,
            endpoints=endpoints,
            users=users,
            duration=duration,
            ramp_up=ramp_up,
        )
        results = test.execute()
        self.results.append(
            {"type": "load", "timestamp": datetime.utcnow().isoformat(), "results": results}
        )
        return results

    def run_stress_test(
        self,
        endpoints: List[Dict[str, Any]],
        start_users: int = 10,
        end_users: int = 100,
        step: int = 10,
        step_duration: int = 300,
    ) -> List[Dict[str, Any]]:
        """Run stress test with increasing load.

        Args:
            endpoints: List of endpoint configurations
            start_users: Initial number of users
            end_users: Final number of users
            step: User increment per step
            step_duration: Duration per step in seconds

        Returns:
            List of test results
        """
        step_results = []

        for users in range(start_users, end_users + 1, step):
            test = LoadTest(
                base_url=self.base_url,
                endpoints=endpoints,
                users=users,
                duration=step_duration,
                ramp_up=30,
            )
            results = test.execute()
            step_results.append({"users": users, "results": results})

        self.results.append(
            {"type": "stress", "timestamp": datetime.utcnow().isoformat(), "steps": step_results}
        )

        return step_results

    def run_soak_test(
        self, endpoints: List[Dict[str, Any]], users: int = 10, duration: int = 3600
    ) -> Dict[str, Any]:
        """Run soak test with sustained load over long period.

        Args:
            endpoints: List of endpoint configurations
            users: Number of concurrent users
            duration: Test duration in seconds

        Returns:
            Test results
        """
        test = LoadTest(
            base_url=self.base_url, endpoints=endpoints, users=users, duration=duration, ramp_up=60
        )
        results = test.execute()
        self.results.append(
            {"type": "soak", "timestamp": datetime.utcnow().isoformat(), "results": results}
        )
        return results

    def get_test_history(self) -> List[Dict[str, Any]]:
        """Get history of test results.

        Returns:
            List of test results
        """
        return self.results
