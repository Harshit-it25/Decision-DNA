import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from app.db import init_db, seed_applicants_from_csv, DB_MODE

def main():
    print("--- Decision DNA Database Seeding Tool ---")
    print(f"Current Database Mode: {DB_MODE.upper()}")
    
    # Initialize DB (creates tables & seeds users)
    print("Initializing schemas and seeding default users...")
    init_db()
    
    if DB_MODE == 'mysql':
        print("Database schema verified and tables created in MySQL.")
        print("Seeding applicants...")
        seed_applicants_from_csv()
        print("Seeding process completed successfully.")
    else:
        print("MySQL database is not active (SQLite/CSV fallback is active).")
        print("No seeding is required since the application reads directly from local files in fallback mode.")

if __name__ == "__main__":
    main()
