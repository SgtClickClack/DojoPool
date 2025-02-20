from multiprocessing import Pool
import gc
from multiprocessing import Pool
import gc
"""Dependency management and fixing module.

This module provides automated dependency issue detection and fixing capabilities.
"""

import ast
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import pkg_resources
import safety
from packaging.version import parse as parse_version

logger = logging.getLogger(__name__)

class DependencyFixer:
    """Automated dependency management tool."""

    def __init__(self, project_root: Path):
        """Initialize dependency fixer.
        
        Args:
            project_root: Root directory of the project
        """
        self.project_root = project_root
        self.logger = logging.getLogger(__name__)
        
    def fix_all(self, path: Optional[Path] = None) -> Dict[str, Any]:
        """Run all dependency fixes on the codebase.
        
        Args:
            path: Specific path to fix, or entire project if None
            
        Returns:
            Dict containing results of all fixes
        """
        results = {}
        
        # Fix security vulnerabilities
        results["security"] = self.fix_security_issues()
        
        # Fix version conflicts
        results["conflicts"] = self.fix_version_conflicts()
        
        # Fix unused dependencies
        results["unused"] = self.fix_unused_dependencies()
        
        # Fix missing dependencies
        results["missing"] = self.fix_missing_dependencies()
        
        total_fixes = sum(r.get("fixes_applied", 0) for r in results.values())
        return {"fixes_applied": total_fixes, "details": results}
        
    def fix_security_issues(self) -> Dict[str, Any]:
        """Find and fix security vulnerabilities in dependencies.
        
        Returns:
            Dict containing results of security fixes
        """
        fixes_applied = 0
        
        try:
            # Check for known vulnerabilities
            vulns = safety.check(
                packages=self._get_installed_packages(),
                cached=False,
                key=None,
                db_mirror=None,
                proxy=None,
            )
            
            # Update vulnerable packages
            for vuln in vulns:
                package_name = vuln.package
                safe_version = vuln.safe_version
                
                if self._update_package_version(package_name, safe_version):
                    fixes_applied += 1
                    
        except Exception as e:
            self.logger.error(f"Failed to fix security issues: {str(e)}")
            
        return {
            "status": "completed",
            "fixes_applied": fixes_applied
        }
        
    def fix_version_conflicts(self) -> Dict[str, Any]:
        """Find and fix dependency version conflicts.
        
        Returns:
            Dict containing results of conflict fixes
        """
        fixes_applied = 0
        
        try:
            # Get all dependencies
            dependencies = self._get_all_dependencies()
            
            # Check for conflicts
            for package, versions in dependencies.items():
                if len(versions) > 1:
                    # Use highest compatible version
                    highest_version = max(versions, key=parse_version)
                    if self._update_package_version(package, highest_version):
                        fixes_applied += 1
                        
        except Exception as e:
            self.logger.error(f"Failed to fix version conflicts: {str(e)}")
            
        return {
            "status": "completed",
            "fixes_applied": fixes_applied
        }
        
    def fix_unused_dependencies(self) -> Dict[str, Any]:
        """Find and remove unused dependencies.
        
        Returns:
            Dict containing results of unused dependency fixes
        """
        fixes_applied = 0
        
        try:
            # Get installed packages
            installed = self._get_installed_packages()
            
            # Get used packages
            used = self._get_used_packages()
            
            # Remove unused packages
            for package in installed:
                if package not in used:
                    if self._remove_package(package):
                        fixes_applied += 1
                        
        except Exception as e:
            self.logger.error(f"Failed to fix unused dependencies: {str(e)}")
            
        return {
            "status": "completed",
            "fixes_applied": fixes_applied
        }
        
    def fix_missing_dependencies(self) -> Dict[str, Any]:
        """Find and add missing dependencies.
        
        Returns:
            Dict containing results of missing dependency fixes
        """
        fixes_applied = 0
        
        try:
            # Get installed packages
            installed = self._get_installed_packages()
            
            # Get imported packages
            imported = self._get_imported_packages()
            
            # Add missing packages
            for package in imported:
                if package not in installed:
                    if self._add_package(package):
                        fixes_applied += 1
                        
        except Exception as e:
            self.logger.error(f"Failed to fix missing dependencies: {str(e)}")
            
        return {
            "status": "completed",
            "fixes_applied": fixes_applied
        }
        
    def _get_installed_packages(self) -> Set[str]:
        """Get set of installed package names.
        
        Returns:
            Set of package names
        """
        return {pkg.key for pkg in pkg_resources.working_set}
        
    def _get_all_dependencies(self) -> Dict[str, Set[str]]:
        """Get all dependencies and their versions.
        
        Returns:
            Dict mapping package names to sets of versions
        """
        dependencies = {}
        
        for pkg in pkg_resources.working_set:
            if pkg.key not in dependencies:
                dependencies[pkg.key] = set()
            dependencies[pkg.key].add(pkg.version)
            
            # Add dependencies of this package
            for req in pkg.requires():
                if req.key not in dependencies:
                    dependencies[req.key] = set()
                if req.specs:
                    for op, ver in req.specs:
                        dependencies[req.key].add(ver)
                        
        return dependencies
        
    def _get_used_packages(self) -> Set[str]:
        """Get set of packages used in the codebase.
        
        Returns:
            Set of package names
        """
        used = set()
        
        # Scan all Python files
        for py_file in self.project_root.rglob("*.py"):
            try:
                with open(py_file) as f:
                    tree = ast.parse(f.read())
                    
                # Look for imports
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            used.add(name.name.split(".")[0])
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            used.add(node.module.split(".")[0])
                            
            except Exception:
                continue
                
        return used
        
    def _get_imported_packages(self) -> Set[str]:
        """Get set of imported package names.
        
        Returns:
            Set of package names
        """
        imported = set()
        
        # Scan all Python files
        for py_file in self.project_root.rglob("*.py"):
            try:
                with open(py_file) as f:
                    tree = ast.parse(f.read())
                    
                # Look for imports
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            imported.add(name.name.split(".")[0])
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            imported.add(node.module.split(".")[0])
                            
            except Exception:
                continue
                
        return imported
        
    def _update_package_version(self, package: str, version: str) -> bool:
        """Update package to specific version.
        
        Args:
            package: Package name
            version: Version to update to
            
        Returns:
            Boolean indicating if update was successful
        """
        try:
            import subprocess
            
            result = subprocess.run(
                ["pip", "install", f"{package}=={version}"],
                capture_output=True,
                text=True,
            )
            
            return result.returncode == 0
            
        except Exception as e:
            self.logger.error(f"Failed to update {package}: {str(e)}")
            return False
            
    def _remove_package(self, package: str) -> bool:
        """Remove a package.
        
        Args:
            package: Package name
            
        Returns:
            Boolean indicating if removal was successful
        """
        try:
            import subprocess
            
            result = subprocess.run(
                ["pip", "uninstall", "-y", package],
                capture_output=True,
                text=True,
            )
            
            return result.returncode == 0
            
        except Exception as e:
            self.logger.error(f"Failed to remove {package}: {str(e)}")
            return False
            
    def _add_package(self, package: str) -> bool:
        """Add a package.
        
        Args:
            package: Package name
            
        Returns:
            Boolean indicating if installation was successful
        """
        try:
            import subprocess
            
            result = subprocess.run(
                ["pip", "install", package],
                capture_output=True,
                text=True,
            )
            
            return result.returncode == 0
            
        except Exception as e:
            self.logger.error(f"Failed to add {package}: {str(e)}")
            return False 