import gc
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import psutil
from PIL import Image

from ...config.compression_config import DEFAULT_COMPRESSION_CONFIG

class ImageFormat(Enum):
    pass

class CompressionConfig:
    pass

class BatchProcessingResult:
    pass

class ImageCompressionService:
    pass
