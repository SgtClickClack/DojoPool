"""Type stub for room config module."""

from typing import Any, Dict, Optional

RoomConfig = Dict[str, Any]
MetadataSchema = Dict[str, Dict[str, Any]]

def get_room_config(room_type: str) -> RoomConfig: ...
def get_default_metadata(room_type: str) -> Dict[str, Any]: ...
def validate_room_config(config: RoomConfig) -> Optional[str]: ...
