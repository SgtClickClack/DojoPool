from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

import sqlalchemy as sa
from alembic import op
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

branch_labels: NoneType = None
depends_on: NoneType = None

def upgrade() -> None: ...
def downgrade() -> None: ...
