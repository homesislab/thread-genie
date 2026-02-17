@echo off
echo 🚀 Running migrations on external database...
docker-compose exec app npx prisma db push

echo 🚀 Database is up to date.
pause
