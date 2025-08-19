"""
Seed script for Prisma SQLite dev database.

- Creates a large number of Users with realistic fake data
- Creates a number of Dojos (represented by the `Venue` model) with realistic fake data
- Optionally creates Clans and marks a controlling clan for each Dojo by:
  * creating a Territory for the Venue owned by a user from that clan
  * including the clan name in the Venue.description

Usage:
  - Ensure your Python virtual environment is active (e.g., .venv311)
  - Install Faker if not installed: pip install Faker
  - Run from the project root or directly: python services/api/prisma/seed.py

Notes:
  - The database file is expected at services/api/prisma/dev.db as per schema.prisma
  - This script uses sqlite3 directly; Prisma migrations should already have been applied
"""
from __future__ import annotations

import os
import random
import sqlite3
from contextlib import closing
from datetime import datetime

try:
    from faker import Faker
except ImportError as e:
    raise SystemExit(
        "Faker is not installed. Activate your venv and run: pip install Faker"
    ) from e

# Paths
THIS_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(THIS_DIR, "dev.db")

fake = Faker()


def connect_db() -> sqlite3.Connection:
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(
            f"SQLite database not found at {DB_PATH}. Ensure Prisma has created dev.db."
        )
    conn = sqlite3.connect(DB_PATH)
    # Enforce foreign keys in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def table_exists(conn: sqlite3.Connection, table: str) -> bool:
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table,)
    )
    return cur.fetchone() is not None


def count_rows(conn: sqlite3.Connection, table: str) -> int:
    cur = conn.execute(f"SELECT COUNT(1) FROM \"{table}\";")
    row = cur.fetchone()
    return int(row[0]) if row else 0


def create_users(conn: sqlite3.Connection, target_count: int = 100) -> None:
    if not table_exists(conn, "User"):
        raise RuntimeError("Table 'User' does not exist. Run Prisma migrate/dev first.")

    created = 0
    fake.unique.clear()

    with conn:
        for _ in range(target_count):
            email = fake.unique.safe_email()
            username = fake.unique.user_name()[:30]
            password_hash = fake.sha256()
            role = random.choice(["USER", "USER", "USER", "ADMIN"])  # mostly USER

            try:
                conn.execute(
                    """
                    INSERT INTO "User" (email, username, passwordHash, role)
                    VALUES (?, ?, ?, ?);
                    """,
                    (email, username, password_hash, role),
                )
                created += 1
            except sqlite3.IntegrityError:
                # In case of any unexpected uniqueness collision, skip and continue
                continue

    print(f"Users: inserted {created} new rows (now total {count_rows(conn, 'User')}).")


def ensure_clans(conn: sqlite3.Connection, desired: int = 6) -> None:
    """Create a few clans with random leaders if none exist. Returns None."""
    if not table_exists(conn, "Clan"):
        return  # Schema may not include Clan in some variants; fail gracefully

    existing = count_rows(conn, "Clan")
    if existing >= desired:
        print(f"Clans: existing {existing} >= desired {desired}; skipping creation.")
        return

    # Need users to exist to assign as leaders
    user_ids = [row[0] for row in conn.execute('SELECT id FROM "User";').fetchall()]
    if not user_ids:
        print("Clans: no users available to assign as leaders; skipping clans creation.")
        return

    to_create = desired - existing
    created = 0
    fake.unique.clear()

    with conn:
        for _ in range(to_create):
            leader_id = random.choice(user_ids)
            name = f"{fake.unique.color_name()} {fake.unique.word().capitalize()} Clan"
            desc = fake.sentence(nb_words=10)
            try:
                conn.execute(
                    'INSERT INTO "Clan" (name, description, leaderId) VALUES (?, ?, ?);',
                    (name, desc, leader_id),
                )
                created += 1
            except sqlite3.IntegrityError:
                continue

    print(f"Clans: inserted {created} new rows (now total {count_rows(conn, 'Clan')}).")

    # Add a few members to each clan (if ClanMember exists)
    if table_exists(conn, "ClanMember"):
        clan_ids = [row[0] for row in conn.execute('SELECT id FROM "Clan";').fetchall()]
        with conn:
            for clan_id in clan_ids:
                # sample 5 random members per clan
                members = random.sample(user_ids, k=min(5, len(user_ids)))
                for uid in members:
                    try:
                        conn.execute(
                            'INSERT OR IGNORE INTO "ClanMember" (clanId, userId, role) VALUES (?, ?, ?);',
                            (clan_id, uid, random.choice(["MEMBER", "ELITE", "OFFICER"]))
                        )
                    except sqlite3.IntegrityError:
                        continue
        print("ClanMember: membership seeded (best-effort).")


def create_dojos(conn: sqlite3.Connection, target_count: int = 20) -> None:
    """
    Create Dojos using the Venue model. We'll include realistic names, address, and coordinates.
    If Clan and Territory tables exist, we also mark a controlling clan per Dojo by:
      - Creating a Territory owned by a random member (or leader) of that clan
      - Annotating Venue.description with the controlling clan name
    """
    if not table_exists(conn, "Venue"):
        raise RuntimeError("Table 'Venue' does not exist. Run Prisma migrate/dev first.")

    created = 0

    # Prepare some candidate clan associations if available
    clans = []
    if table_exists(conn, "Clan"):
        clans = conn.execute('SELECT id, name FROM "Clan";').fetchall()

    # Build a mapping of clanId -> list of userIds for ownership selection
    clan_members: dict[str, list[str]] = {}
    if clans and table_exists(conn, "ClanMember"):
        for row in conn.execute('SELECT clanId, userId FROM "ClanMember";').fetchall():
            clan_members.setdefault(row[0], []).append(row[1])
    # Ensure leaders can be chosen as owners too
    if clans:
        for row in conn.execute('SELECT id, leaderId FROM "Clan";').fetchall():
            clan_id, leader_id = row
            clan_members.setdefault(clan_id, []).append(leader_id)

    with conn:
        for _ in range(target_count):
            name = f"{fake.unique.city()} Dojo"
            address = fake.address().replace("\n", ", ")
            # realistic latitude and longitude
            lat = float(fake.latitude())
            lng = float(fake.longitude())

            description = fake.catch_phrase()
            controlling_clan_id = None
            controlling_clan_name = None

            if clans:
                controlling_clan_id, controlling_clan_name = random.choice(clans)
                description = f"Controlled by {controlling_clan_name}. " + description

            try:
                conn.execute(
                    'INSERT INTO "Venue" (name, description, lat, lng, address, ownerId) VALUES (?, ?, ?, ?, ?, NULL);',
                    (name, description, lat, lng, address),
                )
                created += 1
            except sqlite3.IntegrityError:
                # If uniqueness constraints are added later, skip duplicates
                continue

            # If possible, create a Territory to reflect control by a user in the controlling clan
            if controlling_clan_id and table_exists(conn, "Territory"):
                # fetch last inserted venue id
                venue_id_row = conn.execute('SELECT id FROM "Venue" ORDER BY rowid DESC LIMIT 1;').fetchone()
                if venue_id_row:
                    venue_id = venue_id_row[0]
                    owners = clan_members.get(controlling_clan_id) or []
                    owner_id = random.choice(owners) if owners else None
                    if owner_id:
                        try:
                            conn.execute(
                                'INSERT INTO "Territory" (name, description, venueId, ownerId) VALUES (?, ?, ?, ?);',
                                (f"{name} Territory", f"Ownership by {controlling_clan_name}", venue_id, owner_id),
                            )
                        except sqlite3.IntegrityError:
                            pass

    print(f"Dojos (Venues): inserted {created} new rows (now total {count_rows(conn, 'Venue')}).")


def main() -> None:
    print(f"Seeding database at: {DB_PATH}")
    with closing(connect_db()) as conn:
        # Basic report of existing core tables
        core_tables = ["User", "Venue", "Clan", "ClanMember", "Territory"]
        existing = [t for t in core_tables if table_exists(conn, t)]
        print("Found tables:", ", ".join(existing) if existing else "(none)")

        # Seed Users
        create_users(conn, target_count=100)
        # Ensure some clans to control dojos (optional)
        ensure_clans(conn, desired=6)
        # Seed Dojos (Venues)
        create_dojos(conn, target_count=20)

    print("Seeding completed at", datetime.utcnow().isoformat() + "Z")


if __name__ == "__main__":
    main()
