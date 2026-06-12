import base64
import json
import os
import requests
from google.cloud import pubsub_v1

# Environment variables
VALIDATED_TOPIC = os.environ.get('VALIDATED_TOPIC', 'claims-validated')
REVIEW_TOPIC = os.environ.get('REVIEW_TOPIC', 'claims-flagged-for-review')
SAP_API_GATEWAY_URL = os.environ.get('SAP_API_GATEWAY_URL', 'https://api.discovery.co.za/v1/sap-rules')

publisher = pubsub_v1.PublisherClient()
project_id = os.environ.get('GCP_PROJECT_ID')

def handler(event, context):
    """Triggered by a message on a Cloud Pub/Sub topic.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    doc_ai_output = json.loads(pubsub_message)
    
    # 1. Extraction confidence check
    overall_confidence = doc_ai_output.get('confidence_scores', {}).get('overall', 0)
    
    validation_results = {
        "passed": [],
        "failed": []
    }
    
    # 2. Apply Validation Rules
    try:
        # V001-V005: Call API Gateway for SAP/HealthID lookups
        rules_payload = {
            "icd_10_codes": [c['code'] for c in doc_ai_output['fields'].get('icd_10_codes', [])],
            "cpt_codes": [c['code'] for c in doc_ai_output['fields'].get('cpt_codes', [])],
            "provider_id": doc_ai_output['fields'].get('provider', {}).get('practice_number'),
            "member_id": doc_ai_output['fields'].get('member', {}).get('discovery_member_id'),
            "amount": doc_ai_output['fields'].get('amounts', {}).get('total_claimed')
        }
        
        # Simulating external validation call
        # response = requests.post(SAP_API_GATEWAY_URL, json=rules_payload)
        # response.raise_for_status()
        # rules_status = response.json()
        
        # Mocking rules for implementation
        rules_status = {
            "V001": True, "V002": True, "V003": True, "V004": True, "V005": True
        }
        
        for rule_id, passed in rules_status.items():
            if passed:
                validation_results["passed"].append(rule_id)
            else:
                validation_results["failed"].append(rule_id)
                
        # V006: Date Validity (Logic)
        service_date = doc_ai_output['fields'].get('dates', {}).get('service_date')
        # Logic to check dates...
        validation_results["passed"].append("V006")

    except Exception as e:
        print(f"Error during validation: {e}")
        validation_results["failed"].append("SYSTEM_ERROR")

    # 3. Decision & Routing
    is_valid = (overall_confidence >= 0.80) and (len(validation_results["failed"]) == 0)
    
    output_payload = {
        "document_id": doc_ai_output.get('document_id'),
        "fields": doc_ai_output.get('fields'),
        "confidence": overall_confidence,
        "validation_results": validation_results,
        "fhir_mapping": map_to_fhir(doc_ai_output)
    }
    
    topic_name = VALIDATED_TOPIC if is_valid else REVIEW_TOPIC
    topic_path = publisher.topic_path(project_id, topic_name)
    
    data = json.dumps(output_payload).encode('utf-8')
    publisher.publish(topic_path, data=data)
    
    print(f"Processed document {doc_ai_output.get('document_id')} -> {topic_name}")

def map_to_fhir(doc):
    """Simple mock FHIR mapping."""
    return {
        "resourceType": "Claim",
        "status": "active",
        "type": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/claim-type", "code": "professional"}]},
        "patient": {"reference": f"Patient/{doc['fields']['member']['discovery_member_id']}"},
        "total": {"value": doc['fields']['amounts']['total_claimed'], "currency": "ZAR"}
    }
