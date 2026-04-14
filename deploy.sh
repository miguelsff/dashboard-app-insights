#!/usr/bin/env bash
# deploy.sh — Build image, push to ACR, and deploy to Azure Web App
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found. Copy .env.example to .env and configure it."
  exit 1
fi

# shellcheck source=.env
source "$ENV_FILE"

# Validate required vars
: "${ACR_NAME:?ACR_NAME must be set in .env}"
: "${WEBAPP_NAME:?WEBAPP_NAME must be set in .env}"

PORT="${PORT:-3000}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${ACR_NAME}.azurecr.io/${WEBAPP_NAME}:${IMAGE_TAG}"

echo "====================================================="
echo " Build & Push: ${FULL_IMAGE}"
echo "====================================================="
echo ""

# 1. Login to ACR
echo "==> [1/3] Logging in to Azure Container Registry..."
az acr login --name "$ACR_NAME"

# 2. Build image
echo "==> [2/3] Building Docker image..."
docker build \
  --build-arg PORT="$PORT" \
  -t "$FULL_IMAGE" \
  "$SCRIPT_DIR"

# 3. Push to ACR
echo "==> [3/3] Pushing image to ACR..."
docker push "$FULL_IMAGE"

echo ""
echo "====================================================="
echo " Image pushed: ${FULL_IMAGE}"
echo "====================================================="
