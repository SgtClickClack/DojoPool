import asyncio
import time
from dataclasses import dataclass
from typing import Dict, List, Literal

import numpy as np
import psutil


@dataclass
class MemoryProfile:
    spike_threshold: float  # MB threshold for spike detection
    sampling_rate: int  # ms between samples
    retention_period: int  # ms to retain samples
    mitigation_strategy: Literal["immediate", "deferred", "progressive"]


class MemoryProfiler:
    def __init__(self, profile: MemoryProfile):
        self.profile = profile
        self.samples: List[Dict[str, float]] = []
        self.last_sample_time = 0
        self.is_monitoring = False
        self._monitor_task = None

    async def start_monitoring(self):
        """Start memory monitoring."""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        self._monitor_task = asyncio.create_task(self._collect_samples())

    async def stop_monitoring(self):
        """Stop memory monitoring."""
        if not self.is_monitoring:
            return

        self.is_monitoring = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass

    async def _collect_samples(self):
        """Collect memory samples at the specified rate."""
        while self.is_monitoring:
            current_time = time.time() * 1000  # Convert to ms

            # Check if it's time for a new sample
            if current_time - self.last_sample_time >= self.profile.sampling_rate:
                sample = self._get_memory_sample()
                self.samples.append(sample)
                self.last_sample_time = current_time

                # Check for memory spikes
                if self._detect_spike(sample):
                    await self._handle_spike(sample)

                # Clean up old samples
                self._cleanup_old_samples(current_time)

            await asyncio.sleep(
                self.profile.sampling_rate / 1000
            )  # Convert ms to seconds

    def _get_memory_sample(self) -> Dict[str, float]:
        """Get current memory usage sample."""
        process = psutil.Process()
        vm = psutil.virtual_memory()

        return {
            "timestamp": time.time() * 1000,  # ms
            "rss": process.memory_info().rss / (1024 * 1024),  # Convert to MB
            "vms": process.memory_info().vms / (1024 * 1024),  # Convert to MB
            "percent": process.memory_percent(),
            "system_available": vm.available / (1024 * 1024),  # Convert to MB
            "system_percent": vm.percent,
        }

    def _detect_spike(self, sample: Dict[str, float]):
        """Detect if the current sample represents a memory spike."""
        if len(self.samples) < 2:
            return False

        # Calculate the moving average of the last few samples
        recent_samples = self.samples[-5:]  # Use last 5 samples
        avg_rss = np.mean(
            [s["rss"] for s in recent_samples[:-1]]
        )  # Exclude current sample

        # Check if current RSS exceeds threshold above average
        return sample["rss"] - avg_rss > self.profile.spike_threshold

    async def _handle_spike(self, sample: Dict[str, float]):
        """Handle detected memory spike based on mitigation strategy."""
        if self.profile.mitigation_strategy == "immediate":
            # Trigger immediate garbage collection and memory cleanup
            import gc

            gc.collect()

        elif self.profile.mitigation_strategy == "deferred":
            # Schedule cleanup for next idle period
            asyncio.create_task(self._deferred_cleanup())

        elif self.profile.mitigation_strategy == "progressive":
            # Gradually reduce memory usage
            asyncio.create_task(self._progressive_cleanup(sample["rss"]))

    async def _deferred_cleanup(self):
        """Perform cleanup during next idle period."""
        # Wait for a relatively idle period
        await asyncio.sleep(1)
        import gc

        gc.collect()

    async def _progressive_cleanup(self, current_usage: float):
        """Progressively reduce memory usage."""
        target = current_usage - self.profile.spike_threshold
        while current_usage > target and self.is_monitoring:
            import gc

            gc.collect()
            # Check current usage
            process = psutil.Process()
            current_usage = process.memory_info().rss / (1024 * 1024)
            await asyncio.sleep(0.1)

    def _cleanup_old_samples(self, current_time: float):
        """Remove samples older than retention period."""
        cutoff_time = current_time - self.profile.retention_period
        self.samples = [s for s in self.samples if s["timestamp"] > cutoff_time]

    def get_metrics(self) -> Dict:
        """Get current memory metrics and analysis."""
        if not self.samples:
            return {}

        recent_samples = self.samples[-50:]  # Use last 50 samples for analysis
        rss_values = [s["rss"] for s in recent_samples]

        return {
            "current_usage": self.samples[-1]["rss"],
            "peak_usage": max(rss_values),
            "average_usage": np.mean(rss_values),
            "std_dev": np.std(rss_values),
            "spike_count": sum(1 for s in recent_samples if self._detect_spike(s)),
            "system_memory_pressure": self.samples[-1]["system_percent"] > 80,
        }

    def get_recommendations(self) -> List[str]:
        """Get memory optimization recommendations based on collected metrics."""
        metrics = self.get_metrics()
        recommendations = []

        if not metrics:
            return ["Start monitoring to get recommendations"]

        if metrics["spike_count"] > 5:
            recommendations.append(
                "Consider increasing spike threshold or implementing more aggressive cleanup"
            )

        if metrics["system_memory_pressure"]:
            recommendations.append(
                "System memory pressure detected - consider scaling horizontally or optimizing memory usage"
            )

        if metrics["current_usage"] > metrics["average_usage"] * 1.5:
            recommendations.append(
                "Current memory usage significantly above average - investigate potential memory leaks"
            )

        return recommendations
