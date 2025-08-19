"""File virus scanning utility."""

import os
import subprocess
import tempfile
from typing import Optional

import clamd
from flask import current_app
from werkzeug.datastructures import FileStorage


class VirusScanError(Exception):
    """Custom exception for virus scanning errors."""

    pass


def get_clamd_client() -> Optional[clamd.ClamdUnixSocket]:
    """Get ClamAV daemon client."""
    try:
        return clamd.ClamdUnixSocket()
    except Exception as e:
        current_app.logger.error(f"Failed to connect to ClamAV: {str(e)}")
        return None


def scan_file_with_clamav(file_path: str) -> bool:
    """Scan file using ClamAV."""
    client = get_clamd_client()
    if not client:
        raise VirusScanError("ClamAV service not available")

    try:
        scan_result = client.scan(file_path)
        file_status = scan_result.get(file_path)
        return file_status[0] == "OK"
    except Exception as e:
        current_app.logger.error(f"ClamAV scan failed: {str(e)}")
        raise VirusScanError(f"Virus scan failed: {str(e)}")


def scan_file_with_yara(file_path: str) -> bool:
    """Scan file using YARA rules."""
    try:
        rules_path = current_app.config.get("YARA_RULES_PATH", "/etc/yara/rules")
        result = subprocess.run(
            ["yara", "-C", rules_path, file_path], capture_output=True, text=True, timeout=30
        )
        # If any rules match, YARA returns output and exit code 0
        return not bool(result.stdout.strip())
    except subprocess.TimeoutExpired:
        raise VirusScanError("Yara scan timed out")
    except Exception as e:
        current_app.logger.error(f"Yara scan failed: {str(e)}")
        raise VirusScanError(f"Yara scan failed: {str(e)}")


def scan_file(file: FileStorage) -> bool:
    """
    Scan uploaded file for viruses and malware.
    Returns True if file is safe, False otherwise.
    """
    if not file:
        return False

    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            file.save(temp_file)
            temp_file.flush()

            try:
                # Scan with ClamAV
                is_safe = scan_file_with_clamav(temp_file.name)
                if not is_safe:
                    current_app.logger.warning(f"ClamAV detected threat in file: {file.filename}")
                    return False

                # Scan with YARA
                is_safe = scan_file_with_yara(temp_file.name)
                if not is_safe:
                    current_app.logger.warning(f"YARA detected threat in file: {file.filename}")
                    return False

                return True

            except VirusScanError as e:
                current_app.logger.error(f"Virus scan failed for {file.filename}: {str(e)}")
                # If scanning fails, reject the file for safety
                return False
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file.name)
                except Exception as e:
                    current_app.logger.error(f"Failed to delete temporary file: {str(e)}")

    except Exception as e:
        current_app.logger.error(f"File scanning failed: {str(e)}")
        return False

    return True
