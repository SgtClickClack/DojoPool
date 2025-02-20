from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import mapped_column
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from ...core.extensions import db
from ...core.models.base import Base
from ...core.validation.validators import AchievementValidator
from ...models.user import User

class Achievement(Base):
    id: Mapped[int]
    name: Mapped[str]
    description: Mapped[str]
    requirement_type: Mapped[Optional[str]]
    reward_type: Mapped[Optional[str]]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

    def __init__(self, **kwargs: Any) -> None: ...
    def validate(self) -> bool: ...
    def is_completed_by(self, user: User) -> bool: ...

class UserAchievement(Base):
    id: Mapped[int]
    user_id: Mapped[int]
    achievement_id: Mapped[int]
    completed_at: Mapped[datetime]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

    user: Mapped[User]
    achievement: Mapped[Achievement]

    def __init__(self, **kwargs: Any) -> None: ...
    def validate(self) -> bool: ...
