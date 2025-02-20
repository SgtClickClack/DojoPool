from datetime import datetime
from enum import Enum
from typing import List, Optional

from ...core.extensions import db
from ...models.venue import Venue  # Import the main Venue model

class TableType(Enum):
    pass

class TableStatus(Enum):
    pass

class PoolTable(db.Model):
    pass
