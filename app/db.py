import os
import sqlite3
import pandas as pd
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Import mysql connector
try:
    import mysql.connector
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False

DB_MODE = 'sqlite'
mysql_config = {}

def check_mysql_connection():
    global DB_MODE, mysql_config
    if not MYSQL_AVAILABLE:
        logging.warning("mysql-connector-python is not installed. Falling back to SQLite/CSV mode.")
        DB_MODE = 'sqlite'
        return False
        
    host = os.getenv("MYSQL_HOST")
    if not host:
        DB_MODE = 'sqlite'
        return False
        
    port = int(os.getenv("MYSQL_PORT", 3306))
    user = os.getenv("MYSQL_USER", "root")
    password = os.getenv("MYSQL_PASSWORD", "decision_dna_2024")
    database = os.getenv("MYSQL_DATABASE", "DecisionDNADB")
    
    mysql_config = {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'database': database
    }
    
    try:
        # Try connecting to MySQL server directly without database first
        conn = mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            connection_timeout=3
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database}")
        conn.commit()
        cursor.close()
        conn.close()
        
        DB_MODE = 'mysql'
        logging.info(f"Successfully connected to MySQL database '{database}' on {host}:{port}.")
        return True
    except Exception as e:
        logging.warning(f"Failed to connect to MySQL at {host}:{port}. Falling back to SQLite/CSV mode. Error: {e}")
        DB_MODE = 'sqlite'
        return False

# Initialize database connection mode
check_mysql_connection()

def get_db_connection():
    if DB_MODE == 'mysql':
        return mysql.connector.connect(**mysql_config)
    else:
        db_path = os.path.join(os.path.dirname(__file__), 'users.db')
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if DB_MODE == 'mysql':
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(50) PRIMARY KEY,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                disabled BOOLEAN NOT NULL DEFAULT FALSE
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS applicants (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                nationality VARCHAR(50),
                income DOUBLE PRECISION NOT NULL,
                debt_ratio DOUBLE PRECISION NOT NULL,
                credit_score INT NOT NULL,
                loan_amount DOUBLE PRECISION NOT NULL,
                gender VARCHAR(20),
                age INT NOT NULL,
                risk_probability DOUBLE PRECISION NOT NULL,
                decision VARCHAR(20) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
    else:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                hashed_password TEXT NOT NULL,
                role TEXT NOT NULL,
                disabled BOOLEAN NOT NULL DEFAULT 0
            )
        ''')
        conn.commit()
        
    cursor.close()
    conn.close()
    
    # Seeding actions
    from app.auth_db import seed_default_users
    seed_default_users()
    
    if DB_MODE == 'mysql':
        seed_applicants_from_csv()

def seed_applicants_from_csv():
    if DB_MODE != 'mysql':
        return
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM applicants")
    count = cursor.fetchone()[0]
    
    if count > 0:
        cursor.close()
        conn.close()
        logging.info("MySQL applicants table already contains records. Skipping CSV seed.")
        return
        
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset.csv')
    if not os.path.exists(dataset_path):
        logging.warning(f"dataset.csv not found at {dataset_path}. Skipping applicant seeding.")
        cursor.close()
        conn.close()
        return
        
    logging.info("Seeding MySQL database from dataset.csv...")
    try:
        df = pd.read_csv(dataset_path)
        df['nationality'] = df['nationality'].fillna('Unknown')
        df['gender'] = df['gender'].fillna('Male')
        df['riskProbability'] = df['riskProbability'].fillna(0.0)
        df['decision'] = df['decision'].fillna('Reject')
        
        query = """
            INSERT INTO applicants (id, name, nationality, income, debt_ratio, credit_score, loan_amount, gender, age, risk_probability, decision)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        batch = []
        batch_size = 5000
        for _, row in df.iterrows():
            batch.append((
                str(row['id']),
                str(row['name']),
                str(row['nationality']),
                float(row['income']),
                float(row['debtRatio']),
                int(row['creditScore']),
                float(row['loanAmount']),
                str(row['gender']),
                int(row['age']),
                float(row['riskProbability']),
                str(row['decision'])
            ))
            if len(batch) >= batch_size:
                cursor.executemany(query, batch)
                conn.commit()
                batch = []
                
        if batch:
            cursor.executemany(query, batch)
            conn.commit()
            
        logging.info(f"Successfully seeded {len(df)} applicants to MySQL.")
    except Exception as e:
        logging.error(f"Error seeding applicants from CSV to MySQL: {e}")
    finally:
        cursor.close()
        conn.close()

def insert_applicant(data: dict):
    if DB_MODE == 'mysql':
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO applicants (id, name, nationality, income, debt_ratio, credit_score, loan_amount, gender, age, risk_probability, decision)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                name=VALUES(name), nationality=VALUES(nationality), income=VALUES(income),
                debt_ratio=VALUES(debt_ratio), credit_score=VALUES(credit_score), loan_amount=VALUES(loan_amount),
                gender=VALUES(gender), age=VALUES(age), risk_probability=VALUES(risk_probability), decision=VALUES(decision)
        """
        cursor.execute(query, (
            data.get('id'),
            data.get('name', 'Anonymous'),
            data.get('nationality', 'Unknown'),
            float(data.get('income', 0)),
            float(data.get('debtRatio', 0)),
            int(data.get('creditScore', 0)),
            float(data.get('loanAmount', 0)),
            data.get('gender', 'Male'),
            int(data.get('age', 30)),
            float(data.get('riskProbability', 0.0)),
            data.get('decision', 'Reject')
        ))
        conn.commit()
        cursor.close()
        conn.close()
        logging.info(f"Applicant {data.get('id')} written to MySQL.")
    else:
        dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset.csv')
        try:
            has_newline = True
            if os.path.exists(dataset_path) and os.path.getsize(dataset_path) > 0:
                with open(dataset_path, "rb") as f:
                    f.seek(-1, os.SEEK_END)
                    if f.read(1) != b'\n':
                        has_newline = False
            
            with open(dataset_path, "a", encoding="utf-8") as f:
                if not has_newline:
                    f.write("\n")
                app_id = data.get("id")
                name = data.get("name", "Anonymous")
                name_quoted = f'"{name}"' if not name.startswith('"') else name
                nationality = data.get("nationality", "Unknown")
                income = data.get("income", 0)
                debt_ratio = f"{data.get('debtRatio', 0):.4f}"
                credit_score = data.get("creditScore", 0)
                loan_amount = data.get("loanAmount", 0)
                gender = data.get("gender", "Male")
                age = data.get("age", 30)
                risk_prob = f"{data.get('riskProbability', 0.0):.4f}"
                fmt_decision = data.get("decision", "Reject").capitalize()
                
                row = f"{app_id},{name_quoted},{nationality},{income},{debt_ratio},{credit_score},{loan_amount},{gender},{age},{risk_prob},{fmt_decision}\n"
                f.write(row)
            logging.info(f"Applicant {data.get('id')} appended to local dataset.csv fallback.")
        except Exception as e:
            logging.error(f"Failed to append to dataset.csv: {e}")

def load_applicants_as_dataframe():
    if DB_MODE == 'mysql':
        conn = get_db_connection()
        query = "SELECT id, name, nationality, income, debt_ratio as debtRatio, credit_score as creditScore, loan_amount as loanAmount, gender, age, risk_probability as riskProbability, decision FROM applicants"
        df = pd.read_sql(query, conn)
        conn.close()
        return df
    else:
        dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset.csv')
        if os.path.exists(dataset_path):
            return pd.read_csv(dataset_path, on_bad_lines='skip')
        else:
            processed_path = os.path.join(os.path.dirname(__file__), '..', 'dataset_processed.csv')
            if os.path.exists(processed_path):
                return pd.read_csv(processed_path, on_bad_lines='skip')
            raise FileNotFoundError("No applicant dataset found.")

def get_applicant(applicant_id: str):
    if DB_MODE == 'mysql':
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT id, name, nationality, income, debt_ratio as debtRatio, credit_score as creditScore, loan_amount as loanAmount, gender, age, risk_probability as riskProbability, decision FROM applicants WHERE id = %s"
        cursor.execute(query, (applicant_id,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        return row
    else:
        df = load_applicants_as_dataframe()
        res = df[df['id'] == applicant_id]
        if not res.empty:
            return res.iloc[0].to_dict()
        return None

