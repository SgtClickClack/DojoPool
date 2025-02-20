import json
import logging
from typing import Any, Dict, Optional

from prometheus_client import Counter

from ...utils.monitoring import REGISTRY
