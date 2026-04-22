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

PROJECT_ID="amara-go"
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
  --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=${BACKEND_URL},NEXT_PUBLIC_ADMIN_EMAIL=${NEXT_PUBLIC_ADMIN_EMAIL},NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}"

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
