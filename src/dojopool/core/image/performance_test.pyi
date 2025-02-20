import logging
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import psutil
from PIL import Image

from .compression import ImageCompressionService

class PerformanceMetrics:
    pass

class ImageCompressionPerformanceTester:
    pass
