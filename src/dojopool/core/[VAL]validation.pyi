import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import bleach
from marshmallow import Schema, ValidationError, fields, validate

class ValidationError(Exception):
    pass

class BaseValidator:
    pass

class UserSchema(Schema):
    pass

class GameSchema(Schema):
    pass

class InputValidator:
    pass
