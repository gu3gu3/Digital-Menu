#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

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