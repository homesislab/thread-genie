#!/bin/bash

# Since DB is external, we'll try to run migrations directly
echo "🚀 Running migrations on external database..."
docker compose exec app npx prisma db push

echo "🚀 Database is up to date."
