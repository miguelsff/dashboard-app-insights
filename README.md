# dashboard-app-insights

Dashboard Next.js para visualizar telemetría de Azure Application Insights.

---

## Despliegue desde una VM en Azure (mismo Resource Group)

Estas instrucciones asumen que ejecutas `deploy.sh` desde una **Azure Virtual Machine** ubicada en el mismo Resource Group que el App Insights de destino.

### Prerequisitos en la VM

Instala las siguientes herramientas si aún no están disponibles:

```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # evita usar sudo en cada comando docker
newgrp docker                   # aplica el grupo sin cerrar sesión
```

Verifica que ambas herramientas funcionen:

```bash
az version
docker version
```

---

### Paso 1 — Clonar el repositorio

```bash
git clone <url-del-repo> dashboard-app-insights
cd dashboard-app-insights
```

---

### Paso 2 — Crear el archivo `.env`

```bash
cp .env.example .env
```

Edita `.env` y completa los valores:

```bash
nano .env   # o usa el editor de tu preferencia
```

Variables obligatorias:

| Variable | Dónde encontrarla |
|---|---|
| `APPLICATIONINSIGHTS_APP_ID` | Portal Azure → App Insights → **Propiedades** → *Application ID* |
| `ACR_NAME` | Nombre del Azure Container Registry **sin** `.azurecr.io` (ej. `miregistry`) |
| `WEBAPP_NAME` | Nombre que tendrá la imagen en ACR y el Azure Web App (ej. `dashboard-insights`) |
| `PORT` | Puerto del contenedor, por defecto `3000` |

Para autenticación, dado que la VM está en Azure con **Managed Identity**, no necesitas configurar `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` ni `AZURE_CLIENT_SECRET`.

---

### Paso 3 — Autenticar con Azure mediante Managed Identity

Desde la VM, inicia sesión usando la identidad administrada asignada:

```bash
az login --identity
```

> Si la VM tiene varias identidades, especifica la correcta con `--username <client-id>`.

Verifica que la sesión es correcta:

```bash
az account show
```

---

### Paso 4 — Verificar permisos necesarios

La identidad de la VM debe tener al menos los siguientes roles en Azure:

| Recurso | Rol mínimo |
|---|---|
| Azure Container Registry (`ACR_NAME`) | **AcrPush** |
| App Insights | **Monitoring Reader** |

Para asignar los roles si aún no están configurados (requiere permisos de Owner/Contributor):

```bash
# Obtener el ID de la identidad de la VM
VM_PRINCIPAL_ID=$(az vm show \
  --name <nombre-vm> \
  --resource-group <resource-group> \
  --query identity.principalId -o tsv)

# Rol AcrPush sobre el ACR
ACR_ID=$(az acr show --name $ACR_NAME --query id -o tsv)
az role assignment create \
  --assignee "$VM_PRINCIPAL_ID" \
  --role AcrPush \
  --scope "$ACR_ID"

# Rol Monitoring Reader sobre el App Insights
APPINSIGHTS_ID=$(az resource show \
  --resource-group <resource-group> \
  --name <nombre-app-insights> \
  --resource-type microsoft.insights/components \
  --query id -o tsv)
az role assignment create \
  --assignee "$VM_PRINCIPAL_ID" \
  --role "Monitoring Reader" \
  --scope "$APPINSIGHTS_ID"
```

---

### Paso 5 — Construir y publicar la imagen en ACR

```bash
bash deploy.sh
```

El script ejecuta los siguientes pasos:

1. Autentica Docker contra el ACR (`az acr login`)
2. Construye la imagen Docker con el `PORT` definido en `.env`
3. Sube la imagen a `<ACR_NAME>.azurecr.io/<WEBAPP_NAME>:latest`

Al finalizar verás:

```
=====================================================
 Image pushed: <acr>.azurecr.io/<webapp>:latest
=====================================================
```

---

### Paso 6 — Desplegar el Azure Web App (primera vez)

Si el Web App aún no existe, créalo configurado para usar la imagen del ACR:

```bash
source .env

# Crear App Service Plan (Linux, SKU B1)
az appservice plan create \
  --name "${WEBAPP_NAME}-plan" \
  --resource-group <resource-group> \
  --is-linux \
  --sku B1

# Crear el Web App apuntando a la imagen en ACR
az webapp create \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group> \
  --plan "${WEBAPP_NAME}-plan" \
  --deployment-container-image-name "${ACR_NAME}.azurecr.io/${WEBAPP_NAME}:${IMAGE_TAG:-latest}"

# Habilitar Managed Identity en el Web App
az webapp identity assign \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group>

# Asignar rol AcrPull al Web App para que pueda descargar la imagen
WEBAPP_PRINCIPAL=$(az webapp identity show \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group> \
  --query principalId -o tsv)

az role assignment create \
  --assignee "$WEBAPP_PRINCIPAL" \
  --role AcrPull \
  --scope "$(az acr show --name $ACR_NAME --query id -o tsv)"

# Asignar rol Monitoring Reader al Web App
az role assignment create \
  --assignee "$WEBAPP_PRINCIPAL" \
  --role "Monitoring Reader" \
  --scope "$APPINSIGHTS_ID"

# Configurar variables de entorno en el Web App
az webapp config appsettings set \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group> \
  --settings \
    APPLICATIONINSIGHTS_APP_ID="$APPLICATIONINSIGHTS_APP_ID" \
    WEBSITES_PORT="$PORT" \
    PORT="$PORT"
```

---

### Paso 7 — Actualizar el Web App tras un nuevo deploy

Cada vez que ejecutes `bash deploy.sh` y quieras que el Web App use la imagen nueva:

```bash
source .env

az webapp restart \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group>
```

O bien fuerza la descarga de la imagen actualizada:

```bash
az webapp config container set \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group> \
  --docker-custom-image-name "${ACR_NAME}.azurecr.io/${WEBAPP_NAME}:${IMAGE_TAG:-latest}"
```

---

### Verificar el estado

```bash
# Ver logs en tiempo real
az webapp log tail \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group>

# URL pública del Web App
az webapp show \
  --name "$WEBAPP_NAME" \
  --resource-group <resource-group> \
  --query defaultHostName -o tsv
```

---

## Ejecución local (sin Azure)

```bash
# Con Docker (producción)
bash install.sh

# Con live reload (desarrollo)
bash install.sh --dev

# Detener
bash stop.sh
```

Requiere configurar en `.env` las variables `AZURE_TENANT_ID`, `AZURE_CLIENT_ID` y `AZURE_CLIENT_SECRET` con un Service Principal que tenga el rol **Monitoring Reader** sobre el App Insights.
