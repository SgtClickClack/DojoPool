from datetime import timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional, Pattern, TypeVar, Union

from fastapi import Request
from fastapi.responses import JSONResponse

T = TypeVar("T")

def cache(
    expire: Union[int, timedelta] = 60,
    key: Optional[str] = None,
    namespace: Optional[str] = None,
) -> Callable[[Callable[..., T]], Callable[..., T]]: ...
def invalidate_endpoint_cache(pattern: Union[str, Pattern[str]]) -> bool: ...
def get_endpoint_cache_stats(pattern: Union[str, Pattern[str]]) -> Dict[str, Any]: ...
