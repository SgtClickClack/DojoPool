

from typing import Any, Dict, List, Optional, Union

from flask import current_app

def emit_event(event_type: str, data: Dict[str, Any], user_ids: Optional[List[int]] = None) -> None:: ...
