@echo off
"C:\Program Files\PostgreSQL\19\bin\psql.exe" "postgresql://postgres.jizljdbungnbvhjnwxvt:Cjay%40Gumama3@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require" -c "SHOW default_transaction_read_only; SHOW transaction_read_only;"
pause