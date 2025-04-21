import sqlite3

for db_path in [
    "src/instance/dojopool.db",
    "instance/test_minimal.db"
]:
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS chat_participants;")
        conn.commit()
        conn.close()
        print(f"Dropped chat_participants from {db_path}")
    except Exception as e:
        print(f"Error with {db_path}: {e}")
