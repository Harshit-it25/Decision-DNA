import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'users.db')

import secrets

def get_password_hash(password: str) -> str:
    salt = os.urandom(16)
    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return f"{salt.hex()}:{hash_obj.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt_hex, hash_hex = hashed_password.split(':')
        salt = bytes.fromhex(salt_hex)
        hash_obj = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
        return secrets.compare_digest(hash_obj.hex(), hash_hex)
    except Exception:
        return False

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL,
            disabled BOOLEAN NOT NULL DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()
    
    seed_default_users()

def seed_default_users():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    admin_pw = os.getenv("ADMIN_PASSWORD", "decision_dna_2024")
    officer_pw = os.getenv("OFFICER_PASSWORD", "officer_pass_2024")
    auditor_pw = os.getenv("AUDITOR_PASSWORD", "auditor_pass_2024")
    
    default_users = [
        ("admin", get_password_hash(admin_pw), "SECURITY_ADMIN", False),
        ("officer", get_password_hash(officer_pw), "MORTGAGE_OFFICER", False),
        ("auditor", get_password_hash(auditor_pw), "AUDITOR", False)
    ]
    
    for user in default_users:
        cursor.execute('''
            INSERT OR IGNORE INTO users (username, hashed_password, role, disabled)
            VALUES (?, ?, ?, ?)
        ''', user)
        
    conn.commit()
    conn.close()

def get_user(username: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    return None
