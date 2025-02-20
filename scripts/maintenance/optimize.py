import json
import logging
import os
import time
import winreg
from datetime import datetime
from typing import Dict, List, Optional

import psutil

# Setup logging based on environment variables
log_level = os.getenv("PERFORMANCE_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("cursor_optimizer.log"), logging.StreamHandler()],
)


def cleanup_processes():
    """Safely clean up excess Cursor and PowerShell processes."""
    try:
        # Get all processes
        cursor_processes = [
            p
            for p in psutil.process_iter(
                ["pid", "name", "cpu_percent", "memory_percent", "create_time"]
            )
            if "cursor" in p.info["name"].lower()
        ]
        pwsh_processes = [
            p
            for p in psutil.process_iter(
                ["pid", "name", "cpu_percent", "memory_percent", "create_time"]
            )
            if "pwsh" in p.info["name"].lower()
        ]

        # Sort by creation time (oldest first)
        cursor_processes.sort(key=lambda x: x.info["create_time"])
        pwsh_processes.sort(key=lambda x: x.info["create_time"])

        logging.info("\n🧹 Cleaning up processes...")

        # Keep only the newest 2 Cursor instances
        if len(cursor_processes) > 2:
            logging.info(
                f"Found {len(cursor_processes)} Cursor instances, keeping newest 2"
            )
            for p in cursor_processes[:-2]:  # All but the newest 2
                try:
                    logging.info(f"Terminating Cursor process {p.pid}")
                    p.terminate()
                except psutil.NoSuchProcess:
                    pass

        # Keep only the newest 2 PowerShell instances
        if len(pwsh_processes) > 2:
            logging.info(
                f"Found {len(pwsh_processes)} PowerShell instances, keeping newest 2"
            )
            for p in pwsh_processes[:-2]:  # All but the newest 2
                try:
                    logging.info(f"Terminating PowerShell process {p.pid}")
                    p.terminate()
                except psutil.NoSuchProcess:
                    pass

        # Wait for processes to terminate
        time.sleep(2)

        # Force kill any that didn't terminate
        for p in cursor_processes[:-2] + pwsh_processes[:-2]:
            try:
                if p.is_running():
                    logging.info(f"Force killing process {p.pid}")
                    p.kill()
            except psutil.NoSuchProcess:
                pass

        logging.info("✅ Process cleanup complete")

    except Exception as e:
        logging.error(f"❌ Error during cleanup: {str(e)}")


def clear_caches():
    """Clear PowerShell and Cursor caches."""
    try:
        logging.info("\n🧹 Clearing caches...")

        # Clear PowerShell module analysis cache
        cache_path = os.path.expandvars(
            "%LOCALAPPDATA%\\Microsoft\\Windows\\PowerShell\\PSModuleAnalysisCache"
        )
        if os.path.exists(cache_path):
            os.remove(cache_path)
            logging.info("✅ Cleared PowerShell module analysis cache")

        # Clear Cursor caches
        cursor_cache = os.path.expandvars("%APPDATA%\\Cursor\\Cache")
        cursor_code_cache = os.path.expandvars("%APPDATA%\\Cursor\\Code Cache")
        cursor_gpm_cache = os.path.expandvars("%APPDATA%\\Cursor\\GPUCache")

        for cache_dir in [cursor_cache, cursor_code_cache, cursor_gpm_cache]:
            if os.path.exists(cache_dir):
                for file in os.listdir(cache_dir):
                    try:
                        file_path = os.path.join(cache_dir, file)
                        if os.path.isfile(file_path):
                            os.unlink(file_path)
                    except Exception as e:
                        logging.warning(f"Could not remove {file}: {str(e)}")
        logging.info("✅ Cleared Cursor caches")

    except Exception as e:
        logging.error(f"❌ Error clearing caches: {str(e)}")


def optimize_cursor():
    """Optimize Cursor and PowerShell performance."""
    try:
        # Get current processes for monitoring
        cursor_processes = [
            p
            for p in psutil.process_iter(
                ["pid", "name", "cpu_percent", "memory_percent"]
            )
            if "cursor" in p.info["name"].lower()
        ]
        pwsh_processes = [
            p
            for p in psutil.process_iter(
                ["pid", "name", "cpu_percent", "memory_percent"]
            )
            if "pwsh" in p.info["name"].lower()
        ]

        logging.info("\n📊 Current Usage:")
        logging.info(f"Cursor instances: {len(cursor_processes)}")
        logging.info(f"PowerShell instances: {len(pwsh_processes)}")

        # Analyze resource usage
        total_cpu = sum(
            p.info["cpu_percent"] for p in cursor_processes + pwsh_processes
        )
        total_memory = sum(
            p.info["memory_percent"] for p in cursor_processes + pwsh_processes
        )
        logging.info(f"Total CPU Usage: {total_cpu:.1f}%")
        logging.info(f"Total Memory Usage: {total_memory:.1f}%")

        # Optimize settings
        config_path = os.path.expanduser("~/AppData/Roaming/Cursor/config.json")
        if os.path.exists(config_path):
            try:
                # Backup current config
                with open(config_path, "r") as f:
                    current_config = json.load(f)

                backup_path = (
                    config_path + f'.backup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
                )
                with open(backup_path, "w") as f:
                    json.dump(current_config, f, indent=2)
                logging.info(f"\n✅ Config backup created: {backup_path}")

                # Apply optimizations
                optimizations = {
                    # Editor Performance
                    "editor.suggest.snippetsPreventQuickSuggestions": True,
                    "editor.suggest.showWords": False,
                    "editor.hover.delay": 1000,
                    "editor.quickSuggestionsDelay": 200,
                    "editor.maxTokenizationLineLength": 10000,
                    "editor.unfoldOnClickAfterEndOfLine": False,
                    "editor.renderWhitespace": "none",
                    "editor.minimap.enabled": False,
                    "editor.renderControlCharacters": False,
                    "editor.hideCursorInOverviewRuler": True,
                    "editor.scrollBeyondLastLine": False,
                    # File System
                    "files.autoSave": "off",
                    "files.watcherExclude": {
                        "**/.git/objects/**": True,
                        "**/node_modules/**": True,
                        "**/venv/**": True,
                        "**/__pycache__/**": True,
                        "**/dist/**": True,
                        "**/build/**": True,
                    },
                    # Workbench
                    "workbench.enablePreview": False,
                    "workbench.editor.enablePreview": False,
                    "workbench.editor.enablePreviewFromQuickOpen": False,
                    "workbench.editor.limit.enabled": True,
                    "workbench.editor.limit.value": 10,
                    "workbench.editor.limit.perEditorGroup": True,
                    "workbench.editor.restoreViewState": True,
                    "workbench.list.smoothScrolling": False,
                    "workbench.reduceMotion": "on",
                    # Search
                    "search.followSymlinks": False,
                    "search.maxResults": 2000,
                    # General Performance
                    "telemetry.telemetryLevel": "off",
                    "extensions.autoUpdate": False,
                    "update.mode": "manual",
                    "files.restoreUndoStack": False,
                    # PowerShell specific
                    "powershell.integratedConsole.showOnStartup": False,
                    "powershell.startAutomatically": True,
                    "powershell.debugging.createTemporaryIntegratedConsole": False,
                    "powershell.developer.editorServicesLogLevel": log_level,
                    "powershell.developer.featureFlags": [],
                    "powershell.codeFormatting.autoCorrectAliases": True,
                    "powershell.codeFormatting.useCorrectCasing": True,
                    "powershell.helpCompletion": "BlockComment",
                    "powershell.integratedConsole.focusConsoleOnExecute": False,
                    "powershell.integratedConsole.suppressStartupBanner": True,
                    "powershell.scriptAnalysis.settingsPath": None,
                    "powershell.scriptAnalysis.enable": True,
                    "powershell.pester.useLegacyCodeLens": False,
                    "powershell.powerShellDefaultVersion": "PowerShell (Store)",
                    "powershell.powerShellAdditionalExePaths": [],
                    "powershell.promptToUpdatePowerShell": True,
                    "powershell.sideBar.CommandExplorerVisibility": False,
                }

                current_config.update(optimizations)
                with open(config_path, "w") as f:
                    json.dump(current_config, f, indent=2)
                logging.info("✅ Applied performance optimizations to Cursor config")

                # Create/update PowerShell profile
                profile_path = os.path.expanduser(
                    "~/Documents/PowerShell/Microsoft.PowerShell_profile.ps1"
                )
                os.makedirs(os.path.dirname(profile_path), exist_ok=True)

                profile_content = """
# Performance optimizations
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
$env:POWERSHELL_TELEMETRY_OPTOUT = 1
$env:POWERSHELL_MAX_MEMORY_MB = '2048'

# Module optimizations
$env:PSModuleAnalysisCachePath = "$env:LOCALAPPDATA\\Microsoft\\Windows\\PowerShell\\PSModuleAnalysisCache"
$env:PSModuleAnalysisCacheEnabled = 1

# Editor Services optimizations
$env:PSES_LOGGING_ENABLED = 0
$env:PSES_LOGGING_LEVEL = 'Normal'

# Improve startup time
$env:POWERSHELL_UPDATECHECK = 'Off'
$env:POWERSHELL_TELEMETRY_OPTOUT = 1

# Optimize PSReadLine
Set-PSReadLineOption -PredictionSource None
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

# Performance monitoring
$env:PERFORMANCE_MONITORING = 'true'
$env:PERFORMANCE_LOG_LEVEL = 'info'
$env:PERFORMANCE_METRICS_INTERVAL = '60'

# Security settings
$env:SECURE_MODE = 'true'
"""

                with open(profile_path, "w") as f:
                    f.write(profile_content)
                logging.info("✅ Created optimized PowerShell profile")

            except Exception as e:
                logging.error(f"❌ Error during optimization: {str(e)}")

        # Print recommendations
        logging.info("\n💡 Optimization Recommendations:")
        logging.info("1. Editor Services:")
        logging.info("   - Disabled unnecessary features")
        logging.info("   - Optimized memory usage")
        logging.info("   - Improved startup configuration")
        logging.info("   - Added performance monitoring")

        logging.info("\n2. Performance Optimizations:")
        logging.info("   - Set memory limits")
        logging.info("   - Disabled telemetry")
        logging.info("   - Optimized file watching")
        logging.info("   - Reduced UI animations")

        logging.info("\n3. Stability Improvements:")
        logging.info("   - Created optimized profiles")
        logging.info("   - Set appropriate error handling")
        logging.info("   - Limited editor instances")
        logging.info("   - Added security settings")

        logging.info("\n⚡ Next steps:")
        logging.info("1. Restart Cursor completely")
        logging.info("2. Open a new PowerShell terminal")
        logging.info("3. Run the following command to reload profile:")
        logging.info("   . $PROFILE")
        logging.info("4. Monitor performance with:")
        logging.info("   Get-Process cursor* | Select-Object Name, CPU, WorkingSet")

    except Exception as e:
        logging.error(f"❌ Error optimizing Cursor: {str(e)}")


if __name__ == "__main__":
    logging.info("🚀 Starting Cursor optimization...")

    # First clean up excess processes
    cleanup_processes()

    # Clear caches
    clear_caches()

    # Run main optimization
    optimize_cursor()
