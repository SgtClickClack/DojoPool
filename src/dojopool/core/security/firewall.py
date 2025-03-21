"""
Firewall management module.
Provides functionality for managing firewall rules and system isolation.
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class FirewallManager:
    """Manages firewall rules and system isolation."""

    def __init__(self):
        """Initialize firewall manager."""
        self.blocked_ips: Dict[str, Dict] = {}
        self.isolated_systems: Dict[str, Dict] = {}
        self.logger = logging.getLogger(__name__)

    async def block_ip(self, ip: str, reason: Optional[str] = None) -> bool:
        """Block an IP address.

        Args:
            ip: IP address to block
            reason: Optional reason for blocking

        Returns:
            bool: True if successful
        """
        try:
            self.blocked_ips[ip] = {
                "timestamp": datetime.now(),
                "reason": reason or "No reason provided",
            }
            self.logger.info(f"Blocked IP {ip}: {reason}")
            return True
        except Exception as e:
            self.logger.error(f"Error blocking IP {ip}: {str(e)}")
            return False

    async def unblock_ip(self, ip: str) -> bool:
        """Unblock an IP address.

        Args:
            ip: IP address to unblock

        Returns:
            bool: True if successful
        """
        try:
            if ip in self.blocked_ips:
                del self.blocked_ips[ip]
                self.logger.info(f"Unblocked IP {ip}")
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error unblocking IP {ip}: {str(e)}")
            return False

    async def isolate_system(self, system: str, reason: Optional[str] = None) -> bool:
        """Isolate a system by restricting network access.

        Args:
            system: System identifier to isolate
            reason: Optional reason for isolation

        Returns:
            bool: True if successful
        """
        try:
            self.isolated_systems[system] = {
                "timestamp": datetime.now(),
                "reason": reason or "No reason provided",
            }
            self.logger.info(f"Isolated system {system}: {reason}")
            return True
        except Exception as e:
            self.logger.error(f"Error isolating system {system}: {str(e)}")
            return False

    async def restore_system(self, system: str) -> bool:
        """Restore network access for an isolated system.

        Args:
            system: System identifier to restore

        Returns:
            bool: True if successful
        """
        try:
            if system in self.isolated_systems:
                del self.isolated_systems[system]
                self.logger.info(f"Restored system {system}")
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error restoring system {system}: {str(e)}")
            return False

    def get_blocked_ips(self) -> List[str]:
        """Get list of currently blocked IPs.

        Returns:
            List[str]: List of blocked IP addresses
        """
        return list(self.blocked_ips.keys())

    def get_isolated_systems(self) -> List[str]:
        """Get list of currently isolated systems.

        Returns:
            List[str]: List of isolated system identifiers
        """
        return list(self.isolated_systems.keys())

    def is_ip_blocked(self, ip: str) -> bool:
        """Check if an IP is blocked.

        Args:
            ip: IP address to check

        Returns:
            bool: True if IP is blocked
        """
        return ip in self.blocked_ips

    def is_system_isolated(self, system: str) -> bool:
        """Check if a system is isolated.

        Args:
            system: System identifier to check

        Returns:
            bool: True if system is isolated
        """
        return system in self.isolated_systems 