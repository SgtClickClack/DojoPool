from decouple import config

# Retrieve configuration variables with default values
DEBUG = config("DEBUG", default=False, cast=bool)
SECRET_KEY = config("SECRET_KEY", default="super-secret-key")
DATABASE_URL = config("DATABASE_URL", default="sqlite:///db.sqlite3")

# You can expand this file with further configuration logic as needed.
