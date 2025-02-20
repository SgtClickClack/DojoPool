from typing import List

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from dojopool.database import db


class TournamentRound(db.Model):
    __tablename__ = "tournament_rounds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament: Mapped[str] = mapped_column(String(100), nullable=False)
    # Assuming a one-to-many relationship (adjust as needed).
    matches: List["Match"] = relationship("Match", backref="tournament_round")
