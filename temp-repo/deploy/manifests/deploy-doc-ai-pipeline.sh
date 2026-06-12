#!/bin/bash
# Conceptual script to create Document AI Processors and deploy Cloud Function

PROJECT_ID="discovery-health-ai"
LOCATION="africa-south1"

# 1. Create GP Invoice Processor
gcloud docai processors create \
    --project=$PROJECT_ID \
    --location=$LOCATION \
    --display-name="discovery-gp-invoice-parser" \
    --type="CUSTOM_EXTRACTION_PROCESSOR"

# 2. Deploy Cloud Function
cd cloud-functions/doc-ai-result-handler
gcloud functions deploy doc-ai-result-handler \
    --project=$PROJECT_ID \
    --runtime=python39 \
    --trigger-topic=doc-ai-output \
    --entry-point=handler \
    --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,VALIDATED_TOPIC=claims-validated,REVIEW_TOPIC=claims-flagged-for-review"
