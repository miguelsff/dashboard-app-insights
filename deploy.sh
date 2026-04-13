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
: "${RESOURCE_GROUP:?RESOURCE_GROUP must be set in .env}"
: "${WEBAPP_NAME:?WEBAPP_NAME must be set in .env}"
: "${WEBAPP_PLAN:?WEBAPP_PLAN must be set in .env}"
: "${LOCATION:?LOCATION must be set in .env}"

PORT="${PORT:-3000}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${ACR_NAME}.azurecr.io/${WEBAPP_NAME}:${IMAGE_TAG}"

echo "====================================================="
echo " Deploy: ${WEBAPP_NAME}"
echo " ACR:    ${FULL_IMAGE}"
echo " RG:     ${RESOURCE_GROUP}  |  Location: ${LOCATION}"
echo "====================================================="
echo ""

# 1. Login to ACR
echo "==> [1/6] Logging in to Azure Container Registry..."
az acr login --name "$ACR_NAME"

# 2. Build image
echo "==> [2/6] Building Docker image..."
docker build \
  --build-arg PORT="$PORT" \
  -t "$FULL_IMAGE" \
  "$SCRIPT_DIR"

# 3. Push to ACR
echo "==> [3/6] Pushing image to ACR..."
docker push "$FULL_IMAGE"

# 4. Ensure App Service Plan exists (Linux, B1)
echo "==> [4/6] Ensuring App Service Plan exists..."
if ! az appservice plan show \
    --name "$WEBAPP_PLAN" \
    --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az appservice plan create \
    --name "$WEBAPP_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --is-linux \
    --sku B1
  echo "     Created plan: $WEBAPP_PLAN"
else
  echo "     Plan already exists: $WEBAPP_PLAN"
fi

# 5. Create or update Web App
echo "==> [5/6] Deploying Web App..."
if ! az webapp show \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" &>/dev/null; then
  az webapp create \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$WEBAPP_PLAN" \
    --deployment-container-image-name "$FULL_IMAGE"
  echo "     Created webapp: $WEBAPP_NAME"
else
  az webapp config container set \
    --name "$WEBAPP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "$FULL_IMAGE"
  echo "     Updated webapp container: $WEBAPP_NAME"
fi

# 6. Enable System Managed Identity + assign Monitoring Reader on App Insights
echo "==> [6/7] Enabling Managed Identity..."
PRINCIPAL_ID=$(az webapp identity assign \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query principalId -o tsv)
echo "     Principal ID: $PRINCIPAL_ID"

APPINSIGHTS_RESOURCE="${NEXT_PUBLIC_RESOURCE_NAME:-}"
if [[ -n "$APPINSIGHTS_RESOURCE" ]]; then
  APPINSIGHTS_ID=$(az resource show \
    --resource-group "$RESOURCE_GROUP" \
    --resource-type "microsoft.insights/components" \
    --name "$APPINSIGHTS_RESOURCE" \
    --query id -o tsv 2>/dev/null || true)

  if [[ -n "$APPINSIGHTS_ID" ]]; then
    echo "==> Assigning Monitoring Reader on: $APPINSIGHTS_RESOURCE"
    az role assignment create \
      --role "Monitoring Reader" \
      --assignee-object-id "$PRINCIPAL_ID" \
      --assignee-principal-type ServicePrincipal \
      --scope "$APPINSIGHTS_ID" \
      --output none 2>/dev/null \
      && echo "     Role assigned." \
      || echo "     (Role already assigned — skipping)"
  else
    echo "     WARNING: App Insights resource '$APPINSIGHTS_RESOURCE' not found in $RESOURCE_GROUP."
    echo "              Assign 'Monitoring Reader' manually via Portal → Access control (IAM)."
  fi
else
  echo "     WARNING: NEXT_PUBLIC_RESOURCE_NAME not set. Assign 'Monitoring Reader' manually."
fi

# 7. Set app settings and restart
echo "==> [7/7] Configuring settings and restarting..."
az webapp config appsettings set \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    PORT="$PORT" \
    WEBSITES_PORT="$PORT" \
    NODE_ENV=production \
    APPLICATIONINSIGHTS_APP_ID="${APPLICATIONINSIGHTS_APP_ID:-}" \
  --output none

az webapp restart \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP"

WEBAPP_URL=$(az webapp show \
  --name "$WEBAPP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostName" -o tsv)

echo ""
echo "====================================================="
echo " Deployment complete!"
echo " URL: https://${WEBAPP_URL}"
echo "====================================================="
