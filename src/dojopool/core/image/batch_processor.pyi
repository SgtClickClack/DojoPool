import gc
import logging
import weakref
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterator, List

from .compression import CompressionConfig, ImageCompressionService, ImageFormat

class BatchProcessingResult:
    pass

class BatchImageProcessor:
    pass
