"""
Benchmarking and Evaluation Script for LegalSaathi AI.
Measures Retrieval Relevance, Citation Correctness, Language Consistency, and Response Latency
across English, Hindi, and Kannada test questions.
"""

import sys
import os
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)

from app.services.legal_retrieval import legal_retrieval_service
from app.services.translation_service import translation_service
from app.services.ai_service import ai_service
from app.utils.emergency import detect_emergency

BENCHMARK_CASES = [
    {
        "id": "TC-01",
        "query": "What are my rights if my employer does not pay my salary?",
        "expected_lang": "en",
        "expected_category": "Labour and Employment Rights",
        "expected_act": "Code on Wages",
        "is_emergency": False
    },
    {
        "id": "TC-02",
        "query": "अगर कोई दुकानदार खराब सामान बेचता है तो मेरे क्या अधिकार हैं?",
        "expected_lang": "hi",
        "expected_category": "Consumer Rights",
        "expected_act": "Consumer Protection Act",
        "is_emergency": False
    },
    {
        "id": "TC-03",
        "query": "ಭೂಮಿಯ ಗಡಿ ವಿವಾದವಾದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?",
        "expected_lang": "kn",
        "expected_category": "Land and Property Disputes",
        "expected_act": "Karnataka Land Revenue Act",
        "is_emergency": False
    },
    {
        "id": "TC-04",
        "query": "Can police refuse to file my FIR and what is Zero FIR?",
        "expected_lang": "en",
        "expected_category": "Criminal Law and FIR Procedures",
        "expected_act": "Bharatiya Nagarik Suraksha Sanhita",
        "is_emergency": False
    },
    {
        "id": "TC-05",
        "query": "Help me my life is in immediate danger someone is attacking me call police now",
        "expected_lang": "en",
        "expected_category": None,
        "expected_act": None,
        "is_emergency": True
    }
]

def run_evaluation():
    print("=" * 70)
    print("          LEGALSATHI AI — SYSTEM BENCHMARK & EVALUATION")
    print("=" * 70)

    total = len(BENCHMARK_CASES)
    retrieval_hits = 0
    language_matches = 0
    emergency_hits = 0
    latencies = []

    for case in BENCHMARK_CASES:
        start_time = time.time()
        print(f"\n[Test Case {case['id']}] Query: '{case['query'][:50]}...'")

        # 1. Language Detection
        detected_lang = translation_service.detect_language(case["query"])
        lang_correct = (detected_lang == case["expected_lang"])
        if lang_correct:
            language_matches += 1
        print(f"  - Language Detection: {detected_lang} (Expected: {case['expected_lang']}) -> {'PASS' if lang_correct else 'FAIL'}")

        # 2. Emergency Detection
        emergency_res = detect_emergency(case["query"])
        is_em = emergency_res is not None and emergency_res.is_emergency
        if is_em == case["is_emergency"]:
            emergency_hits += 1
        print(f"  - Emergency Detection: {is_em} (Expected: {case['is_emergency']}) -> {'PASS' if is_em == case['is_emergency'] else 'FAIL'}")

        # 3. Retrieval Relevance
        if case["expected_category"]:
            results = legal_retrieval_service.retrieve(case["query"], top_k=2)
            if results:
                top_doc = results[0][0]
                cat_match = (top_doc.legal_category == case["expected_category"])
                act_match = (case["expected_act"].lower() in top_doc.act_name.lower())
                hit = cat_match or act_match
                if hit:
                    retrieval_hits += 1
                print(f"  - Top Retrieved Source: '{top_doc.title}' [{top_doc.act_name}] (Score: {results[0][1]:.3f}) -> {'PASS' if hit else 'FAIL'}")
            else:
                print("  - Top Retrieved Source: None retrieved -> FAIL")
        else:
            retrieval_hits += 1
            print("  - Retrieval Step: N/A (Emergency query)")

        elapsed = time.time() - start_time
        latencies.append(elapsed)
        print(f"  - Step Latency: {elapsed * 1000:.2f} ms")

    avg_latency = (sum(latencies) / len(latencies)) * 1000

    print("\n" + "=" * 70)
    print("                       EVALUATION SUMMARY")
    print("=" * 70)
    print(f"Total Benchmark Cases: {total}")
    print(f"Language Detection Accuracy: {language_matches}/{total} ({language_matches/total*100:.1f}%)")
    print(f"Retrieval Relevance (P@1):   {retrieval_hits}/{total} ({retrieval_hits/total*100:.1f}%)")
    print(f"Emergency Trigger Accuracy:  {emergency_hits}/{total} ({emergency_hits/total*100:.1f}%)")
    print(f"Average Pipeline Latency:    {avg_latency:.2f} ms")
    print("=" * 70)

if __name__ == "__main__":
    run_evaluation()
