#!/bin/bash
set -e

PROJECT_ID="build-with-ai-492309"
SERVICE_NAME="ecolens"
REGION="us-central1"
IMAGE="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "Setting gcloud project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo "Submitting build to Google Cloud Build..."
gcloud builds submit --tag $IMAGE .

echo "Deploying to Google Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080

echo "Deployment completed successfully!"
