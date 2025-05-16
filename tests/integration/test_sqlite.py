import sqlite3
import os
import sys

print(f"Running with Python: {sys.executable}") # Verify executable
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instance', 'test_minimal.db'))
instance_dir = os.path.dirname(db_path)

print(f"Attempting to create instance dir: {instance_dir}")
try:
     os.makedirs(instance_dir, exist_ok=True)
     print("Instance directory exists or was created.")
except Exception as e:
     print(f"ERROR creating instance directory: {e}")
     sys.exit(1)


print(f"Attempting to connect to/create: {db_path}")
try:
    conn = sqlite3.connect(db_path)
    print("Connection successful, creating table...")
    conn.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("INSERT INTO test (name) VALUES (?)", ("Test Entry",))
    conn.commit()
    print("Table created and data inserted.")
    conn.close()
    print("Connection closed.")
    # Clean up the test file
    # os.remove(db_path)
    # print(f"Removed test file: {db_path}")
except sqlite3.Error as e:
    print(f"SQLite Error: {e}")
except Exception as e:
    print(f"General Error: {e}") 