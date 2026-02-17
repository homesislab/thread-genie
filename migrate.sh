#!/bin/bash

# Wait for DB to be healthy
echo "⏳ Waiting for MySQL to be ready..."
until docker-compose exec db mysqladmin ping -h localhost -u thread_user --password=PasswordBaruAnda --silent; do
    echo "DB is unavailable - sleeping"
    sleep 2
done

echo "✅ MySQL is up! Running migrations..."
docker-compose exec app npx prisma db push

echo "🚀 Database is up to date."
