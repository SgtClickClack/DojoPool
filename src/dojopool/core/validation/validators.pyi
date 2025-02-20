from typing import Any, Dict

from marshmallow import ValidationError, fields, validate, validates

from .base import BaseValidator

class UserValidator(BaseValidator):
    pass

class VenueValidator(BaseValidator):
    pass

class GameValidator(BaseValidator):
    pass

class AchievementValidator(BaseValidator):
    pass

class UserAchievementValidator(BaseValidator):
    pass
