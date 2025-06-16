#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# Fetch the database URL from Secret Manager and export it
export DATABASE_URL=$(gcloud secrets versions access latest --secret=DATABASE_URL --project=digital-menu-455517)

# Navigate to the backend directory where prisma and the app source are
cd packages/backend

# Run database migration
echo "--- Running Prisma migration ---"
npx prisma migrate deploy

# Run database seeder
echo "--- Running Prisma seeder ---"
npx prisma db seed

# Start the application
echo "--- Starting application ---"
exec node src/index.js 