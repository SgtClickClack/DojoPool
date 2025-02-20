import gzip
import logging
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import boto3
from botocore.exceptions import ClientError

from dojopool.config.backup_config import BackupSettings, backup_settings

class BackupManager:
    pass
