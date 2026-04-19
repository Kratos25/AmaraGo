#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Deploy AmaraGo Frontend → Google Cloud Run
#
# Usage:  BACKEND_URL=https://amarago-backend-xxxx-el.a.run.app bash deploy.sh
#
# Prerequisites:
#   gcloud auth login
#   gcloud config set project amarago-1173a
#   gcloud services enable run.googleapis.com artifactregistry.googleapis.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PROJECT_ID="amara-go"
REGION="asia-south1"
SERVICE_NAME="amarago-frontend"

# ── Require the backend URL ───────────────────────────────────────────────────
if [ -z "${BACKEND_URL:-}" ]; then
  # Try to look it up automatically
  BACKEND_URL=$(gcloud run services describe amarago-backend \
    --project "$PROJECT_ID" --region "$REGION" \
    --format "value(status.url)" 2>/dev/null || true)
fi

if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL is not set and the backend service was not found."
  echo "Deploy the backend first, then run:"
  echo "   BACKEND_URL=https://... bash deploy.sh"
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

# ── Deploy ────────────────────────────────────────────────────────────────────
echo ""
echo "Deploying $SERVICE_NAME to Cloud Run ($REGION) …"
echo "   Backend URL: $BACKEND_URL"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-build-env-vars "NEXT_PUBLIC_API_URL=${BACKEND_URL},NEXT_PUBLIC_ADMIN_EMAIL=${NEXT_PUBLIC_ADMIN_EMAIL},NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID},NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET},NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID},NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}" \
  --set-env-vars "NODE_ENV=production"

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
