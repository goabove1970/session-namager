# PostgreSQL Setup Guide

## Installation on macOS

### Option 1: Using Homebrew (Recommended)

1. **Install Homebrew** (if not already installed):

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install PostgreSQL**:

   ```bash
   brew install postgresql@15
   ```

3. **Start PostgreSQL service**:
   ```bash
   brew services start postgresql@15
   ```

### Option 2: Using Postgres.app (Easier GUI Option)

1. Download from: https://postgresapp.com/
2. Install the app
3. Click "Initialize" to create a new server
4. Add PostgreSQL to your PATH (the app will show instructions)

### Option 3: Direct Download

Download and install from: https://www.postgresql.org/download/macosx/

## Database Setup

### 1. Create Database and User

After installation, open a terminal and run:

```bash
# Connect to PostgreSQL (default superuser)
psql postgres

# Or if using Homebrew with a different user:
psql -U $(whoami) postgres
```

Inside the PostgreSQL prompt:

```sql
-- Create a database (if it doesn't exist)
CREATE DATABASE postgres;

-- Create a user (optional, or use default 'postgres' user)
CREATE USER postgres WITH PASSWORD 'admin';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;

-- Connect to the database
\c postgres

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO postgres;
```

### 2. Set Password for postgres User

If using the default `postgres` user, set the password:

```bash
psql postgres
```

Then in the PostgreSQL prompt:

```sql
ALTER USER postgres WITH PASSWORD 'admin';
\q
```

### 3. Create the Session Table

Run the SQL schema file:

```bash
# From the project root directory
psql -U postgres -d postgres -f database/session.sql
```

If prompted for a password, enter `admin` (or whatever password you set).

**Note**: If the table already exists and you need to update it, you can add the missing `user_id` column:

```sql
ALTER TABLE public.session ADD COLUMN IF NOT EXISTS user_id character varying;
ALTER TABLE public.session ALTER COLUMN login_timestamp TYPE timestamp without time zone;
```

### 4. Verify Setup

```bash
psql -U postgres -d postgres
```

Then:

```sql
\dt  -- List tables (should show 'session' table)
\d session  -- Show session table structure
\q
```

## Configuration

The application is configured to use these default local settings (in `app.config.ts`):

- **Host**: `127.0.0.1`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `admin`
- **Database**: `postgres`
- **Schema**: `public`

If you need different credentials, update the `LOCAL_CONFIG` object in `app.config.ts`.

## Troubleshooting

### Connection Issues

1. **Check if PostgreSQL is running**:

   ```bash
   brew services list  # If using Homebrew
   # or
   pg_isready
   ```

2. **Start PostgreSQL service**:

   ```bash
   brew services start postgresql@15
   # or if using Postgres.app, start the app
   ```

3. **Check connection**:
   ```bash
   psql -U postgres -d postgres -h localhost
   ```

### Permission Issues

If you get permission errors, try:

```bash
psql -U $(whoami) -d postgres
```

Then grant privileges as shown above.
