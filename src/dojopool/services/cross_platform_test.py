import asyncio
import platform
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Union
import json

from .performance_benchmark import PerformanceBenchmark, BenchmarkConfig
from .system_integrator import SystemIntegrator
from .mobile_optimizer import DeviceProfile


@dataclass
class PlatformConfig:
    name: str
    os_type: str
    device_tier: str
    memory_limit: int
    gpu_tier: str
    expected_fps: float
    expected_frame_time: float
    expected_memory_usage: float
    expected_gpu_utilization: float


@dataclass
class TestResult:
    platform: str
    timestamp: datetime
    passed: bool
    metrics: Dict[str, float]
    failures: List[str]
    warnings: List[str]
    recommendations: List[str]


class CrossPlatformTest:
    def __init__(self, system_integrator: SystemIntegrator):
        self.system_integrator = system_integrator
        self.benchmark = PerformanceBenchmark(system_integrator)
        self.logger = logging.getLogger(__name__)
        self.test_history: List[TestResult] = []

        # Define platform configurations
        self.platform_configs = {
            "windows_high": PlatformConfig(
                name="Windows High-End",
                os_type="Windows",
                device_tier="high",
                memory_limit=8192,
                gpu_tier="high",
                expected_fps=60.0,
                expected_frame_time=16.6,
                expected_memory_usage=50.0,
                expected_gpu_utilization=80.0,
            ),
            "windows_medium": PlatformConfig(
                name="Windows Medium",
                os_type="Windows",
                device_tier="medium",
                memory_limit=4096,
                gpu_tier="medium",
                expected_fps=55.0,
                expected_frame_time=18.0,
                expected_memory_usage=60.0,
                expected_gpu_utilization=85.0,
            ),
            "android_high": PlatformConfig(
                name="Android High-End",
                os_type="Android",
                device_tier="high",
                memory_limit=6144,
                gpu_tier="high",
                expected_fps=60.0,
                expected_frame_time=16.6,
                expected_memory_usage=45.0,
                expected_gpu_utilization=75.0,
            ),
            "android_medium": PlatformConfig(
                name="Android Medium",
                os_type="Android",
                device_tier="medium",
                memory_limit=3072,
                gpu_tier="medium",
                expected_fps=50.0,
                expected_frame_time=20.0,
                expected_memory_usage=55.0,
                expected_gpu_utilization=80.0,
            ),
            "ios_high": PlatformConfig(
                name="iOS High-End",
                os_type="iOS",
                device_tier="high",
                memory_limit=4096,
                gpu_tier="high",
                expected_fps=60.0,
                expected_frame_time=16.6,
                expected_memory_usage=40.0,
                expected_gpu_utilization=70.0,
            ),
            "ios_medium": PlatformConfig(
                name="iOS Medium",
                os_type="iOS",
                device_tier="medium",
                memory_limit=2048,
                gpu_tier="medium",
                expected_fps=50.0,
                expected_frame_time=20.0,
                expected_memory_usage=50.0,
                expected_gpu_utilization=75.0,
            ),
        }

    async def run_platform_test(self, platform_key: str) -> TestResult:
        """Run tests for a specific platform configuration."""
        config = self.platform_configs.get(platform_key)
        if not config:
            raise ValueError(f"Invalid platform key: {platform_key}")

        self.logger.info(f"Starting tests for platform: {config.name}")
        failures = []
        warnings = []
        recommendations = []

        # Configure benchmark for platform
        benchmark_config = BenchmarkConfig(
            duration=300,  # 5 minutes
            worker_load=10,
            texture_size=(1024, 1024),
            memory_load=config.memory_limit // 2,
        )

        try:
            # Run benchmark
            result = await self.benchmark.run_benchmark(benchmark_config)

            # Analyze results
            metrics = {
                "fps": result.fps_stats["average"],
                "frame_time": result.frame_time_stats["average"],
                "memory_usage": result.memory_stats["average"],
                "gpu_utilization": result.memory_stats.get("gpu_util", 0),
                "context_losses": result.context_stats["context_losses"],
                "recovery_rate": result.context_stats["recovery_rate"],
                "compression_ratio": result.compression_stats["compression_ratio"],
                "worker_efficiency": result.worker_stats["tasks_processed"]
                / 300,  # tasks per second
            }

            # Check performance against expectations
            if metrics["fps"] < config.expected_fps * 0.95:
                failures.append(f"FPS below target: {metrics['fps']:.1f} vs {config.expected_fps}")
            elif metrics["fps"] < config.expected_fps:
                warnings.append(f"FPS slightly below target: {metrics['fps']:.1f}")

            if metrics["frame_time"] > config.expected_frame_time * 1.05:
                failures.append(f"Frame time above target: {metrics['frame_time']:.1f}ms")
            elif metrics["frame_time"] > config.expected_frame_time:
                warnings.append(f"Frame time slightly high: {metrics['frame_time']:.1f}ms")

            if metrics["memory_usage"] > config.expected_memory_usage * 1.1:
                failures.append(f"Memory usage too high: {metrics['memory_usage']:.1f}MB")
            elif metrics["memory_usage"] > config.expected_memory_usage:
                warnings.append(f"Memory usage higher than target: {metrics['memory_usage']:.1f}MB")

            # Generate recommendations
            if metrics["context_losses"] > 0:
                recommendations.append(
                    "Consider implementing additional context loss prevention measures"
                )

            if metrics["compression_ratio"] < 0.6:
                recommendations.append(
                    "Review texture compression settings for better quality/size balance"
                )

            if metrics["worker_efficiency"] < 2:
                recommendations.append("Consider optimizing worker task processing")

            # Create test result
            test_result = TestResult(
                platform=config.name,
                timestamp=datetime.now(),
                passed=len(failures) == 0,
                metrics=metrics,
                failures=failures,
                warnings=warnings,
                recommendations=recommendations,
            )

            self.test_history.append(test_result)
            return test_result

        except Exception as e:
            self.logger.error(f"Error during platform test: {str(e)}")
            return TestResult(
                platform=config.name,
                timestamp=datetime.now(),
                passed=False,
                metrics={},
                failures=[f"Test execution failed: {str(e)}"],
                warnings=[],
                recommendations=["Investigate test execution failure"],
            )

    async def run_all_tests(self) -> Dict[str, TestResult]:
        """Run tests for all platform configurations."""
        results = {}
        for platform_key in self.platform_configs.keys():
            results[platform_key] = await self.run_platform_test(platform_key)
        return results

    def get_test_summary(self) -> Dict:
        """Generate a summary of all test results."""
        if not self.test_history:
            return {"status": "No tests run"}

        total_tests = len(self.test_history)
        passed_tests = sum(1 for result in self.test_history if result.passed)

        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": (passed_tests / total_tests) * 100,
            "platforms_tested": [result.platform for result in self.test_history],
            "common_failures": self._get_common_issues("failures"),
            "common_warnings": self._get_common_issues("warnings"),
            "recommendations": self._get_common_issues("recommendations"),
        }

    def _get_common_issues(self, issue_type: str) -> List[str]:
        """Get common issues of a specific type across all test results."""
        all_issues = []
        for result in self.test_history:
            issues = getattr(result, issue_type, [])
            all_issues.extend(issues)

        # Count occurrences of each issue
        issue_counts = {}
        for issue in all_issues:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

        # Return issues that appear in more than 25% of tests
        threshold = len(self.test_history) * 0.25
        return [issue for issue, count in issue_counts.items() if count >= threshold]

    def export_results(self, format: str = "dict") -> Union[Dict, str]:
        """Export test results in the specified format."""
        if format == "dict":
            return {
                "summary": self.get_test_summary(),
                "detailed_results": [
                    {
                        "platform": result.platform,
                        "timestamp": result.timestamp.isoformat(),
                        "passed": result.passed,
                        "metrics": result.metrics,
                        "failures": result.failures,
                        "warnings": result.warnings,
                        "recommendations": result.recommendations,
                    }
                    for result in self.test_history
                ],
            }
        elif format == "text":
            summary = self.get_test_summary()
            text_output = [
                "Cross-Platform Test Summary",
                "=========================",
                f"Total Tests: {summary['total_tests']}",
                f"Passed Tests: {summary['passed_tests']}",
                f"Success Rate: {summary['success_rate']:.1f}%",
                "\nPlatforms Tested:",
                *[f"- {platform}" for platform in summary["platforms_tested"]],
                "\nCommon Failures:",
                *[f"- {failure}" for failure in summary["common_failures"]],
                "\nCommon Warnings:",
                *[f"- {warning}" for warning in summary["common_warnings"]],
                "\nRecommendations:",
                *[f"- {rec}" for rec in summary["recommendations"]],
            ]
            return "\n".join(text_output)
        else:
            raise ValueError(f"Unsupported export format: {format}")

    def get_platform_comparison(self) -> Dict:
        """Compare performance across different platforms."""
        if not self.test_history:
            return {"status": "No tests available for comparison"}

        platform_metrics = {}
        for result in self.test_history:
            if result.passed and result.metrics:
                platform_metrics[result.platform] = result.metrics

        if not platform_metrics:
            return {"status": "No valid metrics available for comparison"}

        # Calculate average performance metrics
        avg_metrics = {
            "fps": sum(m["fps"] for m in platform_metrics.values()) / len(platform_metrics),
            "frame_time": sum(m["frame_time"] for m in platform_metrics.values())
            / len(platform_metrics),
            "memory_usage": sum(m["memory_usage"] for m in platform_metrics.values())
            / len(platform_metrics),
            "gpu_utilization": sum(m["gpu_utilization"] for m in platform_metrics.values())
            / len(platform_metrics),
        }

        # Find best and worst performing platforms
        best_platform = max(platform_metrics.items(), key=lambda x: x[1]["fps"])
        worst_platform = min(platform_metrics.items(), key=lambda x: x[1]["fps"])

        return {
            "average_metrics": avg_metrics,
            "best_performing": {"platform": best_platform[0], "metrics": best_platform[1]},
            "worst_performing": {"platform": worst_platform[0], "metrics": worst_platform[1]},
            "performance_variance": {
                "fps": (best_platform[1]["fps"] - worst_platform[1]["fps"])
                / avg_metrics["fps"]
                * 100,
                "frame_time": (worst_platform[1]["frame_time"] - best_platform[1]["frame_time"])
                / avg_metrics["frame_time"]
                * 100,
            },
        }
