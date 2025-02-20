from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Type

from flask import Blueprint, current_app
from werkzeug.wrappers import Response as WerkzeugResponse

class BlueprintConfig:
    pass

class BaseBlueprint(Blueprint):
    pass
