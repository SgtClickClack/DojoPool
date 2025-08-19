import psutil
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import deque

class PerformanceOptimizer:
    def __init__(self, redis_client, db_client):
        self.redis = redis_client
        self.db = db_client
        self.logger = logging.getLogger(__name__)
        self.metrics_history = {
            'cpu': deque(maxlen=60),
            'memory': deque(maxlen=60),
            'network': deque(maxlen=60)
        }
        self.optimization_thresholds = {
            'cpu_percent': 80,
            'memory_percent': 85,
            'network_bytes_sent': 1000000,  # 1MB/s
            'network_bytes_recv': 1000000   # 1MB/s
        }
        self.last_optimization = {}
        self.optimization_cooldown = 3600  # 1 hour

    async def optimize_memory(self) -> Dict:
        """Optimize memory usage."""
        try:
            # Get current memory usage
            memory = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            # Check if optimization is needed
            if memory.percent < self.optimization_thresholds['memory_percent']:
                return {'status': 'no_optimization_needed', 'memory_percent': memory.percent}

            # Implement memory optimization strategies
            optimizations = {
                'triggered_gc': False,
                'cleared_cache': False,
                'reduced_chunk_size': False
            }

            # Trigger garbage collection if memory usage is high
            if memory.percent > 90:
                import gc
                gc.collect()
                optimizations['triggered_gc'] = True

            # Clear Redis cache if memory pressure is high
            if memory.percent > 85:
                await self.redis.flushdb()
                optimizations['cleared_cache'] = True

            # Reduce chunk size for processing
            if memory.percent > 80:
                current_chunk_size = await self.redis.get('chunk_size') or 100
                new_chunk_size = max(10, int(current_chunk_size * 0.8))
                await self.redis.set('chunk_size', new_chunk_size)
                optimizations['reduced_chunk_size'] = True

            return {
                'status': 'optimized',
                'memory_percent': memory.percent,
                'optimizations': optimizations
            }

        except Exception as e:
            self.logger.error(f"Memory optimization error: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    async def optimize_cpu(self) -> Dict:
        """Optimize CPU usage."""
        try:
            # Get current CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Check if optimization is needed
            if cpu_percent < self.optimization_thresholds['cpu_percent']:
                return {'status': 'no_optimization_needed', 'cpu_percent': cpu_percent}

            # Implement CPU optimization strategies
            optimizations = {
                'reduced_threads': False,
                'optimized_queries': False,
                'enabled_caching': False
            }

            # Reduce worker threads if CPU usage is high
            if cpu_percent > 90:
                current_threads = await self.redis.get('worker_threads') or 4
                new_threads = max(1, int(current_threads * 0.8))
                await self.redis.set('worker_threads', new_threads)
                optimizations['reduced_threads'] = True

            # Optimize database queries
            if cpu_percent > 85:
                await self._optimize_database_queries()
                optimizations['optimized_queries'] = True

            # Enable request caching
            if cpu_percent > 80:
                await self.redis.set('enable_request_caching', 'true')
                optimizations['enabled_caching'] = True

            return {
                'status': 'optimized',
                'cpu_percent': cpu_percent,
                'optimizations': optimizations
            }

        except Exception as e:
            self.logger.error(f"CPU optimization error: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    async def optimize_network(self) -> Dict:
        """Optimize network usage."""
        try:
            # Get current network usage
            net_io = psutil.net_io_counters()
            
            # Check if optimization is needed
            if (net_io.bytes_sent < self.optimization_thresholds['network_bytes_sent'] and
                net_io.bytes_recv < self.optimization_thresholds['network_bytes_recv']):
                return {'status': 'no_optimization_needed'}

            # Implement network optimization strategies
            optimizations = {
                'enabled_compression': False,
                'reduced_batch_size': False,
                'optimized_asset_delivery': False
            }

            # Enable compression for large responses
            if net_io.bytes_sent > self.optimization_thresholds['network_bytes_sent']:
                await self.redis.set('enable_compression', 'true')
                optimizations['enabled_compression'] = True

            # Reduce batch size for data transfers
            if net_io.bytes_recv > self.optimization_thresholds['network_bytes_recv']:
                current_batch_size = await self.redis.get('batch_size') or 100
                new_batch_size = max(10, int(current_batch_size * 0.8))
                await self.redis.set('batch_size', new_batch_size)
                optimizations['reduced_batch_size'] = True

            # Optimize asset delivery
            if net_io.bytes_sent > self.optimization_thresholds['network_bytes_sent'] * 0.8:
                await self._optimize_asset_delivery()
                optimizations['optimized_asset_delivery'] = True

            return {
                'status': 'optimized',
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'optimizations': optimizations
            }

        except Exception as e:
            self.logger.error(f"Network optimization error: {str(e)}")
            return {'status': 'error', 'error': str(e)}

    async def _optimize_database_queries(self) -> None:
        """Optimize database queries."""
        try:
            # Get slow queries from database
            slow_queries = await self.db.execute(
                "SELECT query, execution_time FROM pg_stat_statements ORDER BY execution_time DESC LIMIT 10"
            )

            # Optimize each slow query
            for query, execution_time in slow_queries:
                if execution_time > 1000:  # 1 second
                    # Add index if needed
                    await self._add_missing_indexes(query)
                    # Cache query results
                    await self._cache_query_results(query)

        except Exception as e:
            self.logger.error(f"Database query optimization error: {str(e)}")

    async def _optimize_asset_delivery(self) -> None:
        """Optimize asset delivery."""
        try:
            # Enable CDN caching
            await self.redis.set('cdn_cache_enabled', 'true')
            
            # Configure asset compression
            await self.redis.set('asset_compression_level', 'high')
            
            # Enable lazy loading
            await self.redis.set('lazy_loading_enabled', 'true')

        except Exception as e:
            self.logger.error(f"Asset delivery optimization error: {str(e)}")

    async def _add_missing_indexes(self, query: str) -> None:
        """Add missing indexes for slow queries."""
        # Implement index creation logic based on query analysis
        pass

    async def _cache_query_results(self, query: str) -> None:
        """Cache query results."""
        # Implement query result caching logic
        pass

    async def get_optimization_recommendations(self) -> List[Dict]:
        """Get optimization recommendations based on current metrics."""
        recommendations = []
        
        # Check memory usage
        memory = psutil.virtual_memory()
        if memory.percent > self.optimization_thresholds['memory_percent']:
            recommendations.append({
                'type': 'memory',
                'priority': 'high',
                'suggestions': [
                    'Trigger garbage collection',
                    'Clear Redis cache',
                    'Reduce processing chunk size'
                ]
            })

        # Check CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        if cpu_percent > self.optimization_thresholds['cpu_percent']:
            recommendations.append({
                'type': 'cpu',
                'priority': 'high',
                'suggestions': [
                    'Reduce worker threads',
                    'Optimize database queries',
                    'Enable request caching'
                ]
            })

        # Check network usage
        net_io = psutil.net_io_counters()
        if (net_io.bytes_sent > self.optimization_thresholds['network_bytes_sent'] or
            net_io.bytes_recv > self.optimization_thresholds['network_bytes_recv']):
            recommendations.append({
                'type': 'network',
                'priority': 'medium',
                'suggestions': [
                    'Enable response compression',
                    'Reduce batch size',
                    'Optimize asset delivery'
                ]
            })

        return recommendations

    async def start_optimization_loop(self, interval: int = 300):
        """Start continuous optimization monitoring."""
        while True:
            try:
                # Get current metrics
                memory = psutil.virtual_memory()
                cpu_percent = psutil.cpu_percent(interval=1)
                net_io = psutil.net_io_counters()

                # Store metrics in history
                self.metrics_history['memory'].append(memory.percent)
                self.metrics_history['cpu'].append(cpu_percent)
                self.metrics_history['network'].append({
                    'bytes_sent': net_io.bytes_sent,
                    'bytes_recv': net_io.bytes_recv
                })

                # Check if optimization is needed
                if (memory.percent > self.optimization_thresholds['memory_percent'] or
                    cpu_percent > self.optimization_thresholds['cpu_percent'] or
                    net_io.bytes_sent > self.optimization_thresholds['network_bytes_sent'] or
                    net_io.bytes_recv > self.optimization_thresholds['network_bytes_recv']):

                    # Check cooldown period
                    current_time = datetime.now()
                    last_opt_time = self.last_optimization.get('timestamp')
                    if (not last_opt_time or 
                        (current_time - last_opt_time).total_seconds() > self.optimization_cooldown):

                        # Perform optimizations
                        memory_result = await self.optimize_memory()
                        cpu_result = await self.optimize_cpu()
                        network_result = await self.optimize_network()

                        # Store optimization results
                        self.last_optimization = {
                            'timestamp': current_time,
                            'results': {
                                'memory': memory_result,
                                'cpu': cpu_result,
                                'network': network_result
                            }
                        }

            except Exception as e:
                self.logger.error(f"Optimization loop error: {str(e)}")

            await asyncio.sleep(interval) 