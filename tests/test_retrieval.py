"""
Unit tests for Legal Retrieval and Multilingual Mapping in LegalSaathi AI.
"""

import sys
import os

# Add backend directory to sys.path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)

from app.services.legal_retrieval import legal_retrieval_service
from app.services.translation_service import translation_service

def test_knowledge_base_loaded():
    assert len(legal_retrieval_service.records) > 0, "Legal knowledge base should not be empty."
    categories = legal_retrieval_service.get_all_categories()
    assert "Consumer Rights" in categories
    assert "Criminal Law and FIR Procedures" in categories
    assert "Land and Property Disputes" in categories

def test_english_salary_retrieval():
    query = "What are my rights if my employer does not pay my salary?"
    results = legal_retrieval_service.retrieve(query, top_k=2)
    assert len(results) > 0
    top_doc = results[0][0]
    assert "Wage" in top_doc.act_name or "Salary" in top_doc.title or "Labour" in top_doc.legal_category

def test_hindi_consumer_retrieval():
    query = "अगर कोई दुकानदार खराब सामान बेचता है तो मेरे क्या अधिकार हैं?"
    # Detect language
    lang = translation_service.detect_language(query)
    assert lang == "hi"

    # Retrieval
    results = legal_retrieval_service.retrieve(query, top_k=2)
    assert len(results) > 0
    top_doc = results[0][0]
    assert "Consumer" in top_doc.legal_category

def test_kannada_land_dispute_retrieval():
    query = "ಭೂಮಿಯ ಗಡಿ ವಿವಾದವಾದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?"
    # Detect language
    lang = translation_service.detect_language(query)
    assert lang == "kn"

    # Retrieval
    results = legal_retrieval_service.retrieve(query, top_k=2)
    assert len(results) > 0
    top_doc = results[0][0]
    assert "Land" in top_doc.legal_category or "Property" in top_doc.legal_category

def test_bnss_fir_retrieval():
    query = "How to register a Zero FIR if police refuse to take complaint?"
    results = legal_retrieval_service.retrieve(query, top_k=2)
    assert len(results) > 0
    top_doc = results[0][0]
    assert "173" in top_doc.section_number or "BNSS" in top_doc.act_name or "FIR" in top_doc.title

def test_irrelevant_query_handling():
    query = "How to bake a chocolate cake recipe with strawberries?"
    results = legal_retrieval_service.retrieve(query, top_k=2, min_score=0.20)
    assert len(results) == 0, "Completely unrelated non-legal query should not return high-confidence legal records."

if __name__ == "__main__":
    test_knowledge_base_loaded()
    test_english_salary_retrieval()
    test_hindi_consumer_retrieval()
    test_kannada_land_dispute_retrieval()
    test_bnss_fir_retrieval()
    test_irrelevant_query_handling()
    print("All retrieval and multilingual tests passed successfully!")
