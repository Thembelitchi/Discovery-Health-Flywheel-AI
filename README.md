# Discovery Health Flywheel 🚀

[![Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github&style=flat-square)](https://github.com/thembelitchi/discovery-health-flywheel)
[![Languages](https://img.shields.io/badge/Stack-Python%20%7C%20TypeScript%20%7C%20Scala-success?style=flat-square)](#technology-stack)
[![Platforms](https://img.shields.io/badge/Platforms-Neo4j%20%7C%20Kafka%20%7C%20Cloudera%20CDP%20%7C%20GCP%20Vertex%20AI-orange?style=flat-square)](#technology-stack)
[![Compliance](https://img.shields.io/badge/Compliance-POPIA%20%7C%20SARR%20%7C%20HIPAA-red?style=flat-square)](#governance--compliance)

An enterprise-grade, full-stack predictive health platform designed for **Discovery Health South Africa** (holding 58% market share). The platform establishes a **closed-loop self-funding reinvestment layer**: every Rand saved from back-office administrative waste and fraud detection is programmatically written to a secure ledger, immediately unlocking intervention budget tokens to subsidize and dispatch proactive, preventive care-gap vouchers (e.g. cardiac screenings, pediatric clinics, and chronic medicine adherence nudges) for high-risk cohorts.

---

## 🔗 Original Repository
Access the production repository and deployment modules here:
👉 **[thembelitchi/discovery-health-flywheel](https://github.com/thembelitchi/discovery-health-flywheel)**

---

## 🛠️ Technology Stack & Platforms

The system leverages Discovery's existing enterprise investments, needing no rip-and-replace infrastructure:

| Platform / Layer | Core Technology | Primary Language | Function |
| :--- | :--- | :--- | :--- |
| **Graph Analytics** | **Neo4j Enterprise** | Cipher / Cypher Query | Complex Fraud Ring Mapping & Collusion Analysis |
| **Pipeline/Ingestion**| **Apache Kafka** | Python / Java | Low-latency stream ingestion from SAP S/4HANA & mobile |
| **Data Lakehouse** | **Cloudera CDP / Apache Iceberg** | PySpark / SQL | ACID transactions, time-travel auditing, and storage |
| **Model Serving** | **GCP Vertex AI** | Python (TensorFlow, PyTorch)| Multimodal diagnostic predictions and NLP document extracts |
| **Enterprise ERP** | **SAP S/4HANA** | ABAP / OData REST APIs | Claims adjudication, provider payments, financial general ledger |
| **Compliance Layer** | **Cloudera SDX (Shared Data Experience)** | Python | Policy enforcement, schema cataloging, and POPIA token shield |
| **Interactive Console**| **React 19, Vite, Express** | TypeScript | High-impact executive ROI modeling, live telemetry preview |

---

## 🧠 Data Science & Machine Learning Engineering

The core value of the Flywheel lies in modern, highly specialized AI and actuarial algorithms built upon **Python**, **Neo4j**, and **PySpark**:

### 1. Collusion Network & Fraud Detection (Neo4j & PySpark GraphX)
*   **The Challenge**: Static rule engines fail to capture multi-provider phantom clinic networks, upcoding schemes, and identity-sharing fraud.
*   **The Solution**: A bipartite graph linking `(Provider) -[:CLAIMS_TRANS]-> (Member) -[:FILLED_AT]-> (Pharmacy)`.
*   **Algorithm Matrix**:
    *   **PageRank / ArticleRank**: Identifies high-influence node coordinates acting as central hubs for systematic claims multiplication.
    *   **Louvain Community Detection**: Uncovers dense, isolated sub-communities indicating collusion rings.
    *   **Cosine Similarity & Jaccard Index**: Detects high-repetition duplicate claims billing profiles occurring across disparate facilities on identical timestamps.
    *   **GNN Embeddings**: GraphSAGE-based Node Embeddings are exported into Vertex AI representing fraud-likelihood patterns within milliseconds of streaming Kafka ingestion.

### 2. Chronic Disease Medication Adherence Model (Python, XGBoost, Lifelines)
*   **The Challenge**: Identifying chronic disease members (CDL registry) at active risk of dropping off medication prior to hospitalization events.
*   **The Solution**: An event-based survival model trained on multi-temporal pharmacy claims.
*   **Algorithms & Libraries**:
    *   **Cox Proportional Hazards**: Models survival timelines according to dynamic covarities (demographics, co-morbidities, claims velocity).
    *   **Gradient Boosted Decision Trees (XGBoost/LightGBM)**: Predicts absolute probability of a non-adherence event occurring within the upcoming 30 days. Triggers real-time interactive WhatsApp nudges before the critical window closes.

### 3. Geospatial Resource Allocation Optimization (Python, Google BigQuery GIS, PuLP)
*   **The Challenge**: Maximizing the clinical impact per South African Rand (ZAR) invested to dispatch mobile clinic vans across underrepresented districts.
*   **The Solution**: A multi-criteria Linear Programming optimization solver.
*   **Variables**:
    *   Minimize travel cost matrices while maximizing high-risk Care Gap density closure indicators.
    *   Solved via **PuLP COIN-OR** integer linear programming (MIP) executed regularly on BigQuery GIS geospatial grids.

---

## 🏛️ Governance & Compliance (POPIA/HIPAA compliant)

*   **POPIA Compliant Token Shield**: Personal health identifiers (Member IDs, DOBs, physical addresses) are encrypted via **SHA-256 tokenization** inside Cloudera SDX before ingestion into downstream modeling environments.
*   **mTLS Secure Handshakes**: Data synchronization between on-prem Cloudera Spark stream processors and Google Cloud Vertex AI instances operates over encrypted mutual TLS tunnels.
*   **Council for Medical Schemes Auditing**: Custom Apache Iceberg time-travel logs record database schemas and auto-adjudicated ledger transactions, creating absolute operational transparency.

---

## 🚀 90-Day MVP Roadmap

```
  Month 1: Foundation          Month 2: Claims Pilot         Month 3: Care Gaps Scale
[ Unified Member Graph ] ---> [ GCP Document AI Auto-adj ] ---> [ Mobile Clinic Targeting ]
[ Kafka Ingestion Stream ] ---> [ GraphX Fraud Network ]   ---> [ WhatsApp Adherence Nudges ]
```

1.  **Month 1 (Foundation)**: Establish Kafka pipelines connected to SAP OData APIs; persist data in Apache Iceberg tables monitored through Cloudera SDX.
2.  **Month 2 (Agentic Claims Pilot)**: Deploy GCP Document AI algorithms for invoice/prescription extraction, dropping claims review latency from 72 hours down to 4 hours.
3.  **Month 3 (Care Gaps scale)**: Funnel freed audit capital directly into proactive care gap vouchers, launching mobile diabetes & cardio-screening clinics.

---

## 📦 Repository Structure

The core codebase is organized as follows:

```bash
├── connectors/            # SAP OData to Apache Kafka ingestion sinks
├── spark-pipelines/       # PySpark Structured Streaming and GraphX jobs (Python)
├── api-gateway/           # FastAPI-based secure POPIA tokenization & authorization shield
├── deploy/                # Kubernetes manifests for Cloudera CDP Stackable operators
├── src/                   # React 19 visual interactive mock application (TypeScript)
│   ├── components/        # Specialized dashboards, GNN visualizer, and FAQ Knowledge Hub
│   └── App.tsx            # Main visual orchestration console
└── server.ts              # Live Express micro-backend with local fallback intelligence
```

*Architected in June 2026 for Discovery Health South Africa.*
