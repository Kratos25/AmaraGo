#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy AmaraGo Backend → Google Cloud Run  (local Docker build)
#
# Usage:  bash deploy.sh
#         FRONTEND_URL=https://... bash deploy.sh
#
# Prerequisites:
#   gcloud auth login
#   gcloud auth configure-docker asia-south1-docker.pkg.dev
#   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="amarago-1173a"
REGION="asia-south1"
SERVICE_NAME="amarago-backend"
REPO="asia-south1-docker.pkg.dev/$PROJECT_ID/amarago"
IMAGE="$REPO/backend:$(date +%Y%m%d%H%M%S)"
FRONTEND_URL="${FRONTEND_URL:-}"

SA_JSON="./amara_go_service_account.json"

# ── Validate ──────────────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Run from the backend/ directory."
  exit 1
fi
if [ ! -f "$SA_JSON" ]; then
  echo "ERROR: $SA_JSON not found."
  exit 1
fi

get_env() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '"'; }
FIREBASE_STORAGE_BUCKET=$(get_env FIREBASE_STORAGE_BUCKET)

# ── Build CORS_ORIGINS ────────────────────────────────────────────────────────
CORS_ORIGINS="http://localhost:3000"
if [ -n "$FRONTEND_URL" ]; then
  CORS_ORIGINS="${FRONTEND_URL},http://localhost:3000"
fi

# ── Write env-vars YAML (avoids gcloud special-char escaping issues) ──────────
ENV_VARS_FILE=$(mktemp /tmp/cloudrun-env-XXXXXX.yaml)
trap 'rm -f "$ENV_VARS_FILE"' EXIT

python3 - <<PYEOF
import json

sa = json.dumps(json.load(open('$SA_JSON')))
def yq(s): return "'" + s.replace("'", "''") + "'"

with open('$ENV_VARS_FILE', 'w') as f:
    f.write(f'FIREBASE_SERVICE_ACCOUNT_JSON: {yq(sa)}\n')
    f.write(f'FIREBASE_STORAGE_BUCKET: {yq("$FIREBASE_STORAGE_BUCKET")}\n')
    f.write(f'CORS_ORIGINS: {yq("$CORS_ORIGINS")}\n')
    f.write(f'ADMIN_EMAIL: {yq("amarago122@gmail.com")}\n')
PYEOF

# ── Ensure Artifact Registry repo exists ─────────────────────────────────────
gcloud artifacts repositories describe amarago \
  --project "$PROJECT_ID" --location "$REGION" &>/dev/null \
|| gcloud artifacts repositories create amarago \
  --project "$PROJECT_ID" --location "$REGION" \
  --repository-format docker --quiet

# ── Build & push container locally ───────────────────────────────────────────
echo ""
echo "Building Docker image: $IMAGE"
docker build --platform linux/amd64 -t "$IMAGE" .

echo ""
echo "Pushing image to Artifact Registry…"
docker push "$IMAGE"

# ── Deploy to Cloud Run ───────────────────────────────────────────────────────
echo ""
echo "Deploying $SERVICE_NAME to Cloud Run ($REGION)…"
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --env-vars-file "$ENV_VARS_FILE"

echo ""
echo "✅ Backend deployed!"
BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --project "$PROJECT_ID" --region "$REGION" \
  --format "value(status.url)")
echo "   URL: $BACKEND_URL"
echo ""
echo "Next step: deploy the frontend with:"
echo "   BACKEND_URL=$BACKEND_URL bash ../frontend/AmaraGo/deploy.sh"

