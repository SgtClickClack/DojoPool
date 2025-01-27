from typing import Dict, List, Optional, Set
import asyncio
import logging
from datetime import datetime, timedelta
import gc
import psutil
import weakref
import numpy as np
from dataclasses import dataclass


@dataclass
class MemoryAllocation:
    id: str
    size: int
    timestamp: float
    type: str
    owner: str
    is_pooled: bool = False


class MemoryOptimizer:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.allocations: Dict[str, MemoryAllocation] = {}
        self.allocation_history: List[Dict] = []
        self.resource_pools: Dict[str, List] = {}
        self.fragmentation_score = 0.0
        self.last_cleanup = datetime.now()
        self.is_monitoring = False
        self._monitor_task = None

        # Configure thresholds
        self.leak_threshold = 0.15  # 15% growth rate
        self.fragmentation_threshold = 0.20  # 20% fragmentation
        self.pool_size_threshold = 100  # Maximum pool size

        # Weak references for leak detection
        self.object_refs: Dict[int, weakref.ref] = {}

    async def start(self):
        """Start memory optimization monitoring."""
        if self.is_monitoring:
            return

        self.is_monitoring = True
        self._monitor_task = asyncio.create_task(self._monitor_memory())
        self.logger.info("Memory optimization monitoring started")

    async def stop(self):
        """Stop memory optimization monitoring."""
        if not self.is_monitoring:
            return

        self.is_monitoring = False
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        self.logger.info("Memory optimization monitoring stopped")

    async def _monitor_memory(self):
        """Monitor memory usage and trigger optimizations."""
        while self.is_monitoring:
            try:
                # Check for memory leaks
                leaks = self._detect_memory_leaks()
                if leaks:
                    self.logger.warning(f"Potential memory leaks detected: {leaks}")
                    await self._handle_memory_leaks(leaks)

                # Check fragmentation
                fragmentation = self._calculate_fragmentation()
                if fragmentation > self.fragmentation_threshold:
                    self.logger.warning(f"High memory fragmentation detected: {fragmentation:.2%}")
                    await self._defragment_memory()

                # Optimize resource pools
                await self._optimize_resource_pools()

                # Update metrics
                self._update_metrics()

            except Exception as e:
                self.logger.error(f"Error in memory monitoring: {str(e)}")

            await asyncio.sleep(30)  # Check every 30 seconds

    def track_allocation(self, allocation: MemoryAllocation):
        """Track a memory allocation."""
        self.allocations[allocation.id] = allocation
        self.allocation_history.append(
            {
                "id": allocation.id,
                "size": allocation.size,
                "timestamp": allocation.timestamp,
                "type": allocation.type,
                "owner": allocation.owner,
            }
        )

        # Keep history manageable
        if len(self.allocation_history) > 1000:
            self.allocation_history = self.allocation_history[-1000:]

    def release_allocation(self, allocation_id: str):
        """Release a tracked allocation."""
        if allocation_id in self.allocations:
            allocation = self.allocations[allocation_id]
            if allocation.is_pooled:
                # Return to pool instead of releasing
                self._return_to_pool(allocation)
            else:
                del self.allocations[allocation_id]

    def _detect_memory_leaks(self) -> List[Dict]:
        """Detect potential memory leaks."""
        leaks = []
        current_time = datetime.now().timestamp()

        # Analyze allocation patterns
        allocation_rates = {}
        for alloc in self.allocation_history:
            owner = alloc["owner"]
            if owner not in allocation_rates:
                allocation_rates[owner] = []
            allocation_rates[owner].append(alloc["size"])

        # Check for consistent growth
        for owner, sizes in allocation_rates.items():
            if len(sizes) < 5:
                continue

            growth_rate = (sizes[-1] - sizes[0]) / sizes[0]
            if growth_rate > self.leak_threshold:
                leaks.append(
                    {
                        "owner": owner,
                        "growth_rate": growth_rate,
                        "current_size": sizes[-1],
                        "allocation_count": len(sizes),
                    }
                )

        return leaks

    async def _handle_memory_leaks(self, leaks: List[Dict]):
        """Handle detected memory leaks."""
        for leak in leaks:
            # Find related allocations
            related_allocations = [
                alloc for alloc in self.allocations.values() if alloc.owner == leak["owner"]
            ]

            # Force cleanup of old allocations
            for alloc in related_allocations:
                if not alloc.is_pooled:  # Don't cleanup pooled resources
                    self.release_allocation(alloc.id)

        # Force garbage collection
        gc.collect()

    def _calculate_fragmentation(self) -> float:
        """Calculate memory fragmentation score."""
        if not self.allocations:
            return 0.0

        # Calculate fragmentation based on allocation patterns
        sizes = [alloc.size for alloc in self.allocations.values()]
        total_size = sum(sizes)
        max_size = max(sizes)

        # Calculate fragmentation score
        self.fragmentation_score = 1.0 - (max_size / total_size)
        return self.fragmentation_score

    async def _defragment_memory(self):
        """Attempt to defragment memory."""
        # Group allocations by type
        allocations_by_type = {}
        for alloc in self.allocations.values():
            if alloc.type not in allocations_by_type:
                allocations_by_type[alloc.type] = []
            allocations_by_type[alloc.type].append(alloc)

        # Consolidate allocations of the same type
        for alloc_type, allocs in allocations_by_type.items():
            if len(allocs) > 1:
                # Sort by size to optimize consolidation
                allocs.sort(key=lambda x: x.size)

                # Attempt to consolidate small allocations
                small_allocs = [a for a in allocs if a.size < 1024]  # Less than 1KB
                if small_allocs:
                    await self._consolidate_allocations(small_allocs)

    async def _consolidate_allocations(self, allocations: List[MemoryAllocation]):
        """Consolidate small allocations into a pool."""
        total_size = sum(alloc.size for alloc in allocations)
        pool_type = allocations[0].type

        # Create or get pool
        if pool_type not in self.resource_pools:
            self.resource_pools[pool_type] = []

        # Add to pool
        for alloc in allocations:
            if not alloc.is_pooled:
                self.resource_pools[pool_type].append(alloc)
                alloc.is_pooled = True

    async def _optimize_resource_pools(self):
        """Optimize resource pools."""
        for pool_type, pool in self.resource_pools.items():
            # Remove old or unused resources
            current_time = datetime.now().timestamp()
            pool = [
                res
                for res in pool
                if current_time - res.timestamp < 3600  # Keep resources for 1 hour
            ]

            # Limit pool size
            if len(pool) > self.pool_size_threshold:
                # Keep most recently used resources
                pool.sort(key=lambda x: x.timestamp, reverse=True)
                pool = pool[: self.pool_size_threshold]

            self.resource_pools[pool_type] = pool

    def _return_to_pool(self, allocation: MemoryAllocation):
        """Return an allocation to its resource pool."""
        if allocation.type in self.resource_pools:
            allocation.timestamp = datetime.now().timestamp()
            self.resource_pools[allocation.type].append(allocation)

    def _update_metrics(self):
        """Update memory optimization metrics."""
        current_time = datetime.now()

        # Calculate metrics
        total_allocated = sum(alloc.size for alloc in self.allocations.values())
        pooled_memory = sum(
            sum(alloc.size for alloc in pool) for pool in self.resource_pools.values()
        )

        # Update metrics
        self.metrics = {
            "timestamp": current_time.isoformat(),
            "total_allocated": total_allocated,
            "pooled_memory": pooled_memory,
            "fragmentation_score": self.fragmentation_score,
            "allocation_count": len(self.allocations),
            "pool_count": len(self.resource_pools),
            "last_cleanup": self.last_cleanup.isoformat(),
        }

    def get_metrics(self) -> Dict:
        """Get memory optimization metrics."""
        return {
            "allocations": len(self.allocations),
            "fragmentation": self.fragmentation_score,
            "pools": {pool_type: len(pool) for pool_type, pool in self.resource_pools.items()},
            "total_pooled": sum(len(pool) for pool in self.resource_pools.values()),
            "last_cleanup": self.last_cleanup.isoformat(),
        }

    def get_recommendations(self) -> List[str]:
        """Get memory optimization recommendations."""
        recommendations = []

        # Check fragmentation
        if self.fragmentation_score > self.fragmentation_threshold:
            recommendations.append(
                f"High memory fragmentation ({self.fragmentation_score:.2%}) - consider defragmentation"
            )

        # Check pool sizes
        for pool_type, pool in self.resource_pools.items():
            if len(pool) > self.pool_size_threshold * 0.9:
                recommendations.append(
                    f"Resource pool '{pool_type}' near capacity - consider cleanup"
                )

        # Check allocation patterns
        if len(self.allocation_history) > 900:  # 90% of history limit
            recommendations.append("High allocation rate - review allocation patterns")

        return recommendations
