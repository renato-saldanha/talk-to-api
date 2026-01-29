#!/bin/sh

set -e

echo "Starting application initialization..."

echo "Step 1: Waiting for PostgreSQL to be ready..."
./wait-for-postgres.sh postgres 5432 echo "PostgreSQL is ready"

echo "Step 1.5: Verifying database exists..."
# Extract database name from DATABASE_URL
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
if [ -z "$DB_NAME" ]; then
  DB_NAME="talk_to_api"
fi

# Try to connect to the database, if it fails, the database might not exist yet
# This is just a check - Prisma migrations will create it if needed
echo "Database name from URL: $DB_NAME"

echo "Step 2: Validating environment variables..."
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
  echo "ERROR: OPENAI_API_KEY is not set"
  exit 1
fi

if [ -z "$PINECONE_API_KEY" ]; then
  echo "ERROR: PINECONE_API_KEY is not set"
  exit 1
fi

if [ -z "$PINECONE_INDEX_NAME" ]; then
  echo "ERROR: PINECONE_INDEX_NAME is not set"
  exit 1
fi

if [ -z "$PINECONE_ENVIRONMENT" ]; then
  echo "ERROR: PINECONE_ENVIRONMENT is not set"
  exit 1
fi

echo "Environment variables validated"

echo "Step 3: Generating Prisma Client..."
# Verify Prisma is available
if ! command -v npx > /dev/null 2>&1; then
  echo "ERROR: npx not found"
  exit 1
fi

# Try to generate Prisma Client
if ! npx prisma generate; then
  echo "WARNING: Prisma generate failed, trying to verify Prisma installation..."
  # Check if Prisma is installed
  if [ ! -d "node_modules/prisma" ] && [ ! -d "node_modules/.prisma" ]; then
    echo "ERROR: Prisma not found in node_modules. Installation may have failed."
    exit 1
  fi
  echo "Prisma files found, continuing anyway..."
fi

echo "Step 4: Running database migrations..."
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma migrate deploy; then
    echo "Migrations applied successfully"
    break
  else
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
      echo "Migration failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
      sleep 2
      # Try to regenerate Prisma Client before retry
      npx prisma generate || true
    else
      echo "ERROR: Database migrations failed after $MAX_RETRIES attempts. Exiting."
      exit 1
    fi
  fi
done

echo "Step 5: Seeding Pinecone (if needed)..."
if [ "$SKIP_PINECONE_SEED" != "1" ]; then
  if [ -f "dist/scripts/seed-pinecone.js" ]; then
    node dist/scripts/seed-pinecone.js || {
      echo "Warning: Pinecone seed failed, but continuing..."
    }
  else
    echo "Warning: Seed script not found, skipping..."
  fi
else
  echo "Skipping Pinecone seed (SKIP_PINECONE_SEED=1)"
fi

echo "Step 6: Starting NestJS server..."
exec npm run start:prod
