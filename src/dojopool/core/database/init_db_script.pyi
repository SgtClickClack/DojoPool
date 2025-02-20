import os
import sqlite3
from pathlib import Path
from typing import Optional, Union

from dojopool.utils.file_permissions import ensure_directory_exists

def init_db(instance_dir: Union[str, Path]) -> None: ...
