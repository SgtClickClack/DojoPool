import os
from typing import Optional, Type

from .config import Config
from .development import DevelopmentConfig
from .production import ProductionConfig
from .testing import TestingConfig

def get_config(config_name: Optional[str] = None) -> Type[Config]: ...
