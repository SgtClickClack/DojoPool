from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import pytest

from ...models.game import Game
from ...models.user import User
from ...models.venue import Venue
from ..matchmaker import Matchmaker, QueueEntry
from .test_config import TEST_PREFERENCES, TEST_SCHEDULES, TEST_USERS, TEST_VENUES
