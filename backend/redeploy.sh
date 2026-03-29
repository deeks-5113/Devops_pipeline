#!/bin/bash
# Redeploy Script Mapped in the Backend API

# Change this to the path where your docker-compose.yml lives
DEPLOY_DIR="/path/to/your/project"

echo "Change directory to $DEPLOY_DIR"
cd "$DEPLOY_DIR" || { echo "Failed to navigate to project directory"; exit 1; }

echo "1. Bringing containers down..."
docker compose down

echo "2. Pulling latest changes..."
git pull

echo "3. Rebuilding the images..."
docker compose build

echo "4. Starting containers..."
docker compose up -d

echo "Redeployment complete!"
