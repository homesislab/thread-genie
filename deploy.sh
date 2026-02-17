#!/bin/bash

# Build and start the containers
echo "🚀 Starting Docker deployment..."
docker-compose up -d --build

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run prisma db push to sync schema
echo "🔄 Syncing database schema with Prisma..."
docker-compose exec app npx prisma db push

echo "✅ Deployment complete! App is running at http://localhost:3000"
