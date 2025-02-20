import time
from datetime import datetime
from typing import Any, Dict

import redis

from dojopool.core.exceptions import RateLimitError

class RateLimitStrategy:
    pass

class FixedWindowStrategy(RateLimitStrategy):
    pass

class SlidingWindowStrategy(RateLimitStrategy):
    pass

class TokenBucketStrategy(RateLimitStrategy):
    pass

class RateLimiter:
    pass
