# Flywheel Health AI — Discovery Health Flywheel

This repository contains the implementation of the **Discovery Health Flywheel**, a unified, closed-loop AI platform where intelligent claims automation savings are reinvested into proactive member health interventions.

## Architecture
The platform is built on Discovery Health's existing Cloudera CDP on Stackable Kubernetes, integrating SAP S/4HANA and Google Cloud Platform (GCP).

### Components
- **Connectors**: SAP OData to Kafka connectors.
- **Spark Pipelines**: Real-time claims processing and savings calculation.
- **API Gateway**: Secure re-identification layer and service endpoints.
- **ML Models**: Fraud detection, care gap prediction, and edge-optimized clinical models.

## Structure
- `connectors/`: Kafka Connect configurations.
- `spark-pipelines/`: Spark Structured Streaming and GraphX jobs.
- `api-gateway/`: FastAPI-based gateway implementation.
- `deploy/`: Kubernetes manifests for Stackable operators.

## Documentation
See `/home/team/shared/` for architecture and design documents.
