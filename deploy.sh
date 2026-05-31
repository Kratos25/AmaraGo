#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy AmaraGo Frontend → Google Cloud Run  (local Docker build + push)
#
# Usage:  BACKEND_URL=https://amarago-backend-xxxx-el.a.run.app bash deploy.sh
#
# Prerequisites:
#   gcloud auth login
#   gcloud auth configure-docker asia-south1-docker.pkg.dev
#   gcloud config set project amara-go
#   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="amarago-1173a"
REGION="asia-south1"
SERVICE_NAME="amarago-frontend"
REPO="asia-south1-docker.pkg.dev/${PROJECT_ID}/amarago"
IMAGE="${REPO}/frontend:$(date +%Y%m%d%H%M%S)"

# ── Require the backend URL ───────────────────────────────────────────────────
if [ -z "${BACKEND_URL:-}" ]; then
  BACKEND_URL=$(gcloud run services describe amarago-backend \
    --project "$PROJECT_ID" --region "$REGION" \
    --format "value(status.url)" 2>/dev/null || true)
fi

if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL is not set."
  exit 1
fi

# ── Load public env vars from local .env ──────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Run from the frontend/AmaraGo/ directory."
  exit 1
fi

get_env() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d ' '; }

NEXT_PUBLIC_FIREBASE_API_KEY=$(get_env NEXT_PUBLIC_FIREBASE_API_KEY)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(get_env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$(get_env NEXT_PUBLIC_FIREBASE_PROJECT_ID)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$(get_env NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(get_env NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
NEXT_PUBLIC_FIREBASE_APP_ID=$(get_env NEXT_PUBLIC_FIREBASE_APP_ID)
NEXT_PUBLIC_ADMIN_EMAIL=$(get_env NEXT_PUBLIC_ADMIN_EMAIL)
FIREBASE_PROJECT_ID=$(get_env FIREBASE_PROJECT_ID)
FIREBASE_CLIENT_EMAIL=$(get_env FIREBASE_CLIENT_EMAIL)
FIREBASE_PRIVATE_KEY=$(get_env FIREBASE_PRIVATE_KEY)

# ── Write .env.production so Next.js bakes NEXT_PUBLIC_* into the bundle ──────
cat > .env.production << ENVEOF
NEXT_PUBLIC_API_URL=${BACKEND_URL}
NEXT_PUBLIC_ADMIN_EMAIL=${NEXT_PUBLIC_ADMIN_EMAIL}
NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENVEOF
echo "✓ .env.production written"

# ── Ensure Artifact Registry repo exists ─────────────────────────────────────
gcloud artifacts repositories describe amarago \
  --project "$PROJECT_ID" --location "$REGION" &>/dev/null || \
gcloud artifacts repositories create amarago \
  --project "$PROJECT_ID" --location "$REGION" \
  --repository-format docker --description "AmaraGo images"

# ── Build image locally ───────────────────────────────────────────────────────
echo ""
echo "Building Docker image locally…"
docker build --platform linux/amd64 -t "$IMAGE" .
echo "✓ Build complete"

# ── Push to Artifact Registry ─────────────────────────────────────────────────
echo "Pushing image…"
docker push "$IMAGE"
echo "✓ Push complete"

# ── Write env-vars YAML (handles FIREBASE_PRIVATE_KEY newlines safely) ────────
ENV_VARS_FILE=$(mktemp /tmp/cloudrun-frontend-env-XXXXXX.yaml)
trap 'rm -f "$ENV_VARS_FILE"' EXIT

python3 - <<PYEOF
def yq(s): return "'" + str(s).replace("'", "''") + "'"

import os
pk = open('/Users/amara product/frontend/AmaraGo/.env').read()
private_key = ""
for line in pk.splitlines():
    if line.startswith("FIREBASE_PRIVATE_KEY="):
        private_key = line[len("FIREBASE_PRIVATE_KEY="):].strip().strip('"')
        break

with open('$ENV_VARS_FILE', 'w') as f:
    f.write(f'NODE_ENV: {yq("production")}\n')
    f.write(f'NEXT_PUBLIC_API_URL: {yq("${BACKEND_URL}")}\n')
    f.write(f'NEXT_PUBLIC_ADMIN_EMAIL: {yq("${NEXT_PUBLIC_ADMIN_EMAIL}")}\n')
    f.write(f'NEXT_PUBLIC_FIREBASE_API_KEY: {yq("${NEXT_PUBLIC_FIREBASE_API_KEY}")}\n')
    f.write(f'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {yq("${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}")}\n')
    f.write(f'NEXT_PUBLIC_FIREBASE_PROJECT_ID: {yq("${NEXT_PUBLIC_FIREBASE_PROJECT_ID}")}\n')
    f.write(f'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {yq("${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}")}\n')
    f.write(f'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: {yq("${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}")}\n')
    f.write(f'NEXT_PUBLIC_FIREBASE_APP_ID: {yq("${NEXT_PUBLIC_FIREBASE_APP_ID}")}\n')
    f.write(f'FIREBASE_PROJECT_ID: {yq("${FIREBASE_PROJECT_ID}")}\n')
    f.write(f'FIREBASE_CLIENT_EMAIL: {yq("${FIREBASE_CLIENT_EMAIL}")}\n')
    f.write(f'FIREBASE_PRIVATE_KEY: {yq(private_key)}\n')
    f.write(f'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: {yq("${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}")}\n')
PYEOF

# ── Deploy to Cloud Run ───────────────────────────────────────────────────────
echo ""
echo "Deploying $SERVICE_NAME to Cloud Run ($REGION) …"

gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --env-vars-file "$ENV_VARS_FILE"

echo ""
echo "✅ Frontend deployed!"
FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --project "$PROJECT_ID" --region "$REGION" \
  --format "value(status.url)")
echo "   URL: $FRONTEND_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Update backend CORS to include the frontend URL:"
echo ""
echo "   cd ../backend"
echo "   FRONTEND_URL=$FRONTEND_URL bash deploy.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
