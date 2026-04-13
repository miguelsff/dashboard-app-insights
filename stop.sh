#!/usr/bin/env bash
# stop.sh — Stop local Docker container and/or Azure Web App
# Usage:
#   bash stop.sh            — stop local container o compose
#   bash stop.sh --azure    — stop Azure Web App (keeps it)
#   bash stop.sh --delete   — stop AND delete Azure Web App + plan (asks confirmation)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

MODE="local"
if [[ "${1:-}" == "--azure" ]]; then MODE="azure"; fi
if [[ "${1:-}" == "--delete" ]]; then MODE="delete"; fi

# ── Local Docker Compose (modo dev) ──────────────────────────────────────────
if [[ -f "${SCRIPT_DIR}/docker-compose.yml" ]]; then
  COMPOSE_RUNNING=$(docker compose --env-file "$ENV_FILE" ps -q 2>/dev/null || true)
  if [[ -n "$COMPOSE_RUNNING" ]]; then
    echo "==> Stopping docker compose services..."
    docker compose --env-file "$ENV_FILE" down
    echo "     Compose services stopped."
  fi
fi

# ── Local Docker (modo producción) ───────────────────────────────────────────
CONTAINER_NAME="dashboard-app-insights"

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "==> Stopping container: $CONTAINER_NAME"
  docker stop "$CONTAINER_NAME"
  docker rm "$CONTAINER_NAME"
  echo "     Container stopped and removed."
elif docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "==> Removing stopped container: $CONTAINER_NAME"
  docker rm "$CONTAINER_NAME"
else
  echo "    No local container named '$CONTAINER_NAME' found."
fi

# ── Azure ─────────────────────────────────────────────────────────────────────
if [[ "$MODE" == "azure" || "$MODE" == "delete" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: .env not found — cannot determine Azure resource names."
    exit 1
  fi
  # shellcheck source=.env
  source "$ENV_FILE"
  : "${RESOURCE_GROUP:?RESOURCE_GROUP must be set in .env}"
  : "${WEBAPP_NAME:?WEBAPP_NAME must be set in .env}"

  if [[ "$MODE" == "azure" ]]; then
    echo "==> Stopping Azure Web App: $WEBAPP_NAME"
    az webapp stop \
      --name "$WEBAPP_NAME" \
      --resource-group "$RESOURCE_GROUP"
    echo "     Web App stopped (use 'az webapp start' to resume)."
  fi

  if [[ "$MODE" == "delete" ]]; then
    echo ""
    echo "WARNING: This will PERMANENTLY DELETE:"
    echo "  Web App:  $WEBAPP_NAME"
    echo "  Plan:     ${WEBAPP_PLAN:-<not set>}"
    echo "  RG:       $RESOURCE_GROUP"
    read -rp "Type 'yes' to confirm: " CONFIRM
    if [[ "$CONFIRM" != "yes" ]]; then
      echo "Aborted."
      exit 0
    fi

    echo "==> Deleting Azure Web App: $WEBAPP_NAME"
    az webapp delete \
      --name "$WEBAPP_NAME" \
      --resource-group "$RESOURCE_GROUP"

    if [[ -n "${WEBAPP_PLAN:-}" ]]; then
      echo "==> Deleting App Service Plan: $WEBAPP_PLAN"
      az appservice plan delete \
        --name "$WEBAPP_PLAN" \
        --resource-group "$RESOURCE_GROUP" \
        --yes
    fi
    echo "     Azure resources deleted."
  fi
fi

echo ""
echo "Done."
