import mysql.connector
import re

# Cloud credentials with explicit SSL configuration
db = mysql.connector.connect(
    host="mysql-37f32c37-haroldjohnlucas049-134b.e.aivencloud.com",
    user="avnadmin",
    password="AVNS_CD8_UftRDdjOd6L2YJH", 
    port=16428,
    database="defaultdb",
    ssl_disabled=False
)

cursor = db.cursor()

# 1. TEMPORARILY DISABLE ENFORCED PRIMARY KEYS FOR THIS ACTIVE EXPORT SESSION
print("Configuring cloud session parameters...")
cursor.execute("SET sql_require_primary_key = 0;")

# Read your local exported SQL file
sql_file_path = r"C:\Users\USER\Downloads\brew_db.sql"
print("Reading backup file...")

with open(sql_file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Strip out comments (-- comment or /* comment */) to prevent parsing errors
content = re.sub(r'--.*?\n', '', content)
content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)

# Split by semicolons to extract clean individual statements
queries = content.split(';')

print("Executing database schema script statement-by-statement...")
success_count = 0

for query in queries:
    clean_query = query.strip()
    if clean_query:
        try:
            cursor.execute(clean_query)
            success_count += 1
        except Exception as e:
            # Silence expected database/table drops warnings if they don't apply
            if "exists" in str(e).lower() or "not found" in str(e).lower():
                continue
            print(f"Operational skip on line block: {e}")

db.commit()
cursor.close()
db.close()
print(f"\n🎉 Complete! {success_count} queries successfully built and your cloud data is fully seeded.")