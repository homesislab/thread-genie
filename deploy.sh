#!/bin/bash

# Build and start the containers
echo "🚀 Starting Docker deployment..."
docker compose up -d --build

# Run migration script
chmod +x migrate.sh
./migrate.sh

echo "✅ Deployment complete! App is running at https://thread.homesislab.my.id"
