#!/bin/bash

# PostgreSQL Database Setup Script for Session Manager
# This script helps set up the PostgreSQL database for local development

set -e

DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-admin}
DB_NAME=${DB_NAME:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Setting up PostgreSQL database for Session Manager..."
echo "User: $DB_USER"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Add Postgres.app to PATH if it exists
if [ -d "/Applications/Postgres.app/Contents/Versions/latest/bin" ]; then
    export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
    echo "Using Postgres.app binaries"
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql command not found. Please install PostgreSQL first."
    echo "See SETUP_POSTGRES.md for installation instructions."
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "Error: PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL first:"
    echo "  - Homebrew: brew services start postgresql@15"
    echo "  - Postgres.app: Start the application"
    exit 1
fi

# Export password for psql (PGPASSWORD environment variable)
export PGPASSWORD=$DB_PASSWORD

# Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Create the session table
echo "Creating session table..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$(dirname "$0")/../database/session.sql"

# Grant privileges
echo "Granting privileges..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"

echo ""
echo "✓ Database setup complete!"
echo ""
echo "You can now run the application with:"
echo "  npm run start-local"
echo ""
echo "To verify the setup, run:"
echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\\dt'"

# Unset password
unset PGPASSWORD

