#!/usr/bin/env bash
# install.sh — Run the dashboard locally with Docker
#
# Usage:
#   bash install.sh          — producción (build de imagen + docker run)
#   bash install.sh --dev    — desarrollo con live reload (docker compose)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: .env file not found at $ENV_FILE"
  echo "Copy .env.example to .env and fill in the values."
  exit 1
fi

# shellcheck source=.env
source "$ENV_FILE"

MODE="${1:-}"

# ── Modo desarrollo (live reload) ─────────────────────────────────────────────
if [[ "$MODE" == "--dev" ]]; then
  echo "==> Iniciando modo desarrollo con live reload..."
  echo "     HMR activo — los cambios en src/ se reflejan automáticamente"
  docker compose --env-file "$ENV_FILE" up
  exit 0
fi

# ── Modo producción ───────────────────────────────────────────────────────────
CONTAINER_NAME="dashboard-app-insights"
IMAGE_NAME="${CONTAINER_NAME}:local"

echo "==> Building Docker image: $IMAGE_NAME"
docker build \
  --build-arg PORT="${PORT:-3000}" \
  -t "$IMAGE_NAME" \
  "$SCRIPT_DIR"

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "==> Removing existing container: $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME"
fi

echo "==> Starting container: $CONTAINER_NAME"
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  -p "${PORT:-3000}:${PORT:-3000}" \
  "$IMAGE_NAME"

echo ""
echo "Dashboard corriendo en http://localhost:${PORT:-3000}"
echo "Para detener:  bash stop.sh"
echo "Para logs:     docker logs -f $CONTAINER_NAME"
