"""
Network quality detection module with mobile browser support.
"""

from typing import Dict, Any, Optional
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
import statistics
from user_agents import parse
from flask import request

logger = logging.getLogger(__name__)

@dataclass
class NetworkMetrics:
    """Network quality metrics."""
    latency: float  # in milliseconds
    bandwidth: float  # in Mbps
    packet_loss: float  # percentage
    jitter: float  # in milliseconds
    timestamp: datetime

class NetworkQualityDetector:
    """Detects and monitors network quality with mobile support."""
    
    def __init__(self, window_size: int = 50):
        self._window_size = window_size
        self._metrics_history: Dict[str, list[NetworkMetrics]] = {}
        self._last_cleanup = datetime.now()
    
    def record_metrics(self, client_id: str, metrics: NetworkMetrics) -> None:
        """Record network metrics for a client."""
        if client_id not in self._metrics_history:
            self._metrics_history[client_id] = []
            
        history = self._metrics_history[client_id]
        history.append(metrics)
        
        # Keep only the most recent window_size metrics
        if len(history) > self._window_size:
            history.pop(0)
        
        # Cleanup old entries periodically
        self._cleanup_old_entries()
    
    def get_network_quality(self, client_id: str, user_agent: str) -> Dict[str, Any]:
        """
        Get network quality assessment for a client.
        
        Args:
            client_id: Client identifier
            user_agent: User agent string for device detection
            
        Returns:
            Dictionary containing network quality metrics and assessment
        """
        try:
            # Parse user agent for device info
            ua = parse(user_agent)
            is_mobile = ua.is_mobile
            
            # Get metrics history
            history = self._metrics_history.get(client_id, [])
            if not history:
                return self._get_default_quality(is_mobile)
            
            # Calculate recent metrics
            recent_metrics = history[-min(10, len(history)):]
            
            latencies = [m.latency for m in recent_metrics]
            bandwidths = [m.bandwidth for m in recent_metrics]
            packet_losses = [m.packet_loss for m in recent_metrics]
            jitters = [m.jitter for m in recent_metrics]
            
            avg_latency = statistics.mean(latencies)
            avg_bandwidth = statistics.mean(bandwidths)
            avg_packet_loss = statistics.mean(packet_losses)
            avg_jitter = statistics.mean(jitters)
            
            # Adjust thresholds for mobile
            latency_threshold = 300 if is_mobile else 100  # ms
            bandwidth_threshold = 1.5 if is_mobile else 5  # Mbps
            packet_loss_threshold = 2 if is_mobile else 1  # %
            jitter_threshold = 50 if is_mobile else 30  # ms
            
            # Calculate quality score (0-100)
            latency_score = max(0, min(100, (1 - avg_latency / latency_threshold) * 100))
            bandwidth_score = max(0, min(100, (avg_bandwidth / bandwidth_threshold) * 100))
            packet_loss_score = max(0, min(100, (1 - avg_packet_loss / packet_loss_threshold) * 100))
            jitter_score = max(0, min(100, (1 - avg_jitter / jitter_threshold) * 100))
            
            # Weight the scores (prioritize latency and packet loss for mobile)
            if is_mobile:
                weights = {'latency': 0.4, 'bandwidth': 0.2, 'packet_loss': 0.3, 'jitter': 0.1}
            else:
                weights = {'latency': 0.3, 'bandwidth': 0.3, 'packet_loss': 0.2, 'jitter': 0.2}
            
            overall_score = (
                latency_score * weights['latency'] +
                bandwidth_score * weights['bandwidth'] +
                packet_loss_score * weights['packet_loss'] +
                jitter_score * weights['jitter']
            )
            
            quality_level = self._get_quality_level(overall_score)
            
            return {
                'quality': quality_level,
                'score': overall_score,
                'metrics': {
                    'latency': avg_latency,
                    'bandwidth': avg_bandwidth,
                    'packet_loss': avg_packet_loss,
                    'jitter': avg_jitter
                },
                'is_mobile': is_mobile,
                'device_info': {
                    'browser': ua.browser.family,
                    'os': ua.os.family,
                    'device': ua.device.family
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating network quality: {str(e)}")
            return self._get_default_quality(False)
    
    def _get_quality_level(self, score: float) -> str:
        """Convert score to quality level."""
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'fair'
        else:
            return 'poor'
    
    def _get_default_quality(self, is_mobile: bool) -> Dict[str, Any]:
        """Get default quality assessment."""
        return {
            'quality': 'unknown',
            'score': 0,
            'metrics': {
                'latency': 0,
                'bandwidth': 0,
                'packet_loss': 0,
                'jitter': 0
            },
            'is_mobile': is_mobile
        }
    
    def _cleanup_old_entries(self) -> None:
        """Clean up old entries periodically."""
        now = datetime.now()
        if now - self._last_cleanup < timedelta(minutes=5):
            return
            
        self._last_cleanup = now
        cutoff = now - timedelta(hours=1)
        
        for client_id in list(self._metrics_history.keys()):
            history = self._metrics_history[client_id]
            history = [m for m in history if m.timestamp > cutoff]
            if history:
                self._metrics_history[client_id] = history
            else:
                del self._metrics_history[client_id] 