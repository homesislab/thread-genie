@echo off
echo ⏳ Waiting for MySQL to be ready...
:loop
docker-compose exec db mysqladmin ping -h localhost -u thread_user --password=PasswordBaruAnda --silent
if %errorlevel% neq 0 (
    echo DB is unavailable - sleeping
    timeout /t 2 /nobreak > nul
    goto loop
)

echo ✅ MySQL is up! Running migrations...
docker-compose exec app npx prisma db push

echo 🚀 Database is up to date.
pause
