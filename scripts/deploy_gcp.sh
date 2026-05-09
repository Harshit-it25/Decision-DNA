#!/bin/bash
# Decision DNA Cloud Deployment Script (GCP Cloud Run)

# Configuration
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="decision-dna-api"
REGION="us-central1"

echo "Using Project ID: $PROJECT_ID"
echo "Deploying $SERVICE_NAME to $REGION..."

# 1. Build and Submit to Artifact Registry
echo "Building and pushing container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# 2. Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 1

echo "Deployment complete!"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'
