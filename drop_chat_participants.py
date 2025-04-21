import sqlite3

# Path to your SQLite database
DB_PATH = "src/instance/dojopool.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("DROP TABLE IF EXISTS chat_participants;")
conn.commit()
conn.close()

print("chat_participants table dropped.")
