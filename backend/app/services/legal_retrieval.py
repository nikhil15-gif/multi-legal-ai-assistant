"""
Legal Knowledge Retrieval Service for LegalSaathi AI.
Implements TF-IDF and Cosine Similarity RAG retrieval over verified Indian legal records.
"""

import json
import os
import re
from typing import List, Dict, Any, Tuple
from app.models.schemas import LegalRecord, SourceCitation
from app.utils.logger import logger

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn is not available; falling back to lexical term frequency matching.")

# Multilingual legal concept mapping to bridge Hindi and Kannada queries to relevant topics
CONCEPT_MAP = {
    # Land & Property
    "ಗಡಿ": "land boundary dispute demarcation haddubastu",
    "ಭೂಮಿ": "land property encroachment tahsildar survey",
    "ಜಮೀನು": "land property dispute ownership",
    "ಹದ್ದುಬಸ್ತು": "haddubastu boundary survey demarcation",
    "ಅತಿಕ್ರಮಣ": "encroachment illegal possession eviction",
    "ಬಾಡಿಗೆ": "tenant landlord eviction rent",
    "ಬಾಡಿಗೆದಾರ": "tenant eviction transfer of property",
    "जमीन": "land property dispute demarcation",
    "सीमा": "boundary dispute land measurement",
    "अतिक्रमण": "encroachment illegal possession eviction",
    "किराएदार": "tenant landlord eviction rent",
    "मकान मालिक": "landlord eviction notice tenant rights",

    # Consumer
    "ಗ್ರಾಹಕ": "consumer defective product refund warranty",
    "ದೋಷಪೂರಿತ": "defective product consumer protection act",
    "ಮರುಪಾವತಿ": "refund replacement consumer court",
    "ಉಪಭೋಕ್ತ": "consumer protection act complaint refund",
    "उपभोक्ता": "consumer protection act complaint refund",
    "खराब सामान": "defective product replacement refund consumer helpline",
    "दुकानदार": "shopkeeper defective goods consumer rights",
    "रिफंड": "refund replacement consumer court",

    # Criminal & FIR
    "ಎಫ್‌ಐಆರ್": "fir zero fir police cognizable bnss section 173",
    "ಪೊಲೀಸ್": "police complaint fir arrest rights magistrate",
    "ಬಂಧನ": "arrest rights medical examination 24 hours magistrate",
    "एफआईआर": "fir zero fir police station refusal bnss 173",
    "पुलिस": "police complaint fir superintendent magistrate",
    "गिरफ्तारी": "arrest rights grounds medical examination magistrate",
    "कस्टडी": "custody arrest magistrate 24 hours",

    # Women
    "ಗೃಹ ಹಿಂಸೆ": "domestic violence shared household pwdva maintenance",
    "ಮಹಿಳಾ": "women legal rights protection officer",
    "ಕಿರುಕುಳ": "harassment posh act workplace domestic violence",
    "घरेलू हिंसा": "domestic violence pwdva protection order residence",
    "महिला": "women legal rights protection officer",
    "यौन उत्पीड़न": "sexual harassment workplace posh act icc",

    # Labour
    "ಶಂಬಳ": "unpaid salary wages code on wages labour commissioner",
    "ವೇತನ": "salary wages non payment labour court",
    "ಗ್ರಾಚ್ಯುಟಿ": "gratuity continuous service 5 years retirement",
    "वेतन": "salary wages non payment labour court commissioner",
    "सैलरी": "salary unpaid wages employer code on wages",
    "ग्रेच्युटी": "gratuity payment 5 years service",

    # Cybercrime
    "ಸೈಬರ್": "cyber crime fraud 1930 portal it act phishing",
    "ವಂಚನೆ": "fraud identity theft online scam 1930",
    "ಆನ್‌ಲೈನ್": "online fraud cyber crime 1930 helpline",
    "साइबर": "cyber crime fraud 1930 portal it act phishing",
    "ठगी": "online fraud cheating identity theft 1930",
    "धोखाधड़ी": "fraud cyber crime bank upi scam 1930",

    # Procedures & RTI
    "ಉಚಿತ ವಕೀಲ": "free legal aid nalsa 15100 legal services",
    "ಮಾಹಿತಿ ಹಕ್ಕು": "rti right to information pio 30 days",
    "ಆರ್‌ಟಿಐ": "rti application public information officer",
    "मुफ्त वकील": "free legal aid nalsa 15100 legal services",
    "आरटीआई": "rti right to information section 6 public authority",
    "सूचना का अधिकार": "right to information rti pio 30 days"
}

class LegalRetrievalService:
    def __init__(self, data_path: str = None):
        if not data_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_path = os.path.join(base_dir, "data", "legal_knowledge_base.json")
        self.data_path = data_path
        self.records: List[LegalRecord] = []
        self.corpus_texts: List[str] = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.load_knowledge_base()

    def load_knowledge_base(self):
        """Loads and indexes the JSON legal knowledge base."""
        if not os.path.exists(self.data_path):
            logger.error(f"Knowledge base file not found at: {self.data_path}")
            return

        with open(self.data_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        self.records = [LegalRecord(**item) for item in raw_data]
        self.corpus_texts = []

        for r in self.records:
            # Build rich searchable representation
            parts = [
                r.title,
                r.legal_category,
                r.act_name,
                r.section_number,
                r.provision_title,
                r.simplified_explanation,
                r.simplified_explanation_hi or "",
                r.simplified_explanation_kn or "",
                r.source_text,
                " ".join(r.keywords or [])
            ]
            self.corpus_texts.append(" ".join(parts).lower())

        if SKLEARN_AVAILABLE and self.corpus_texts:
            self.vectorizer = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
                sublinear_tf=True
            )
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus_texts)
            logger.info(f"Indexed {len(self.records)} legal records into TF-IDF vector space.")
        else:
            logger.info(f"Loaded {len(self.records)} legal records (lexical fallback).")

    def _expand_multilingual_query(self, query: str) -> str:
        """Expands Indic tokens with associated English and statutory terms."""
        expanded = [query]
        query_words = re.findall(r"\w+", query)
        for w in query_words:
            if w in CONCEPT_MAP:
                expanded.append(CONCEPT_MAP[w])
        # Also check substring match for multi-word keys
        for key, val in CONCEPT_MAP.items():
            if key in query and val not in expanded:
                expanded.append(val)
        return " ".join(expanded)

    def retrieve(self, query: str, top_k: int = 3, min_score: float = 0.05) -> List[Tuple[LegalRecord, float]]:
        """
        Retrieves top relevant legal records with cosine similarity score.
        """
        if not self.records or not query:
            return []

        search_query = self._expand_multilingual_query(query).lower()

        if SKLEARN_AVAILABLE and self.vectorizer is not None and self.tfidf_matrix is not None:
            query_vec = self.vectorizer.transform([search_query])
            sim_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            ranked_indices = sim_scores.argsort()[::-1]

            results = []
            for idx in ranked_indices:
                score = float(sim_scores[idx])
                if score >= min_score:
                    results.append((self.records[idx], score))
                if len(results) >= top_k:
                    break
            return results

        # Simple lexical fallback if scikit-learn is not installed
        scores = []
        stopwords = {"a", "an", "the", "to", "with", "in", "for", "of", "is", "how", "what", "and", "or", "my", "me", "can", "do", "i", "if", "be"}
        tokens = [w for w in re.findall(r"\w+", search_query) if w not in stopwords and len(w) > 2]
        if not tokens:
            return []

        for i, text in enumerate(self.corpus_texts):
            text_tokens = set(re.findall(r"\w+", text))
            common = set(tokens).intersection(text_tokens)
            match_count = len(common)
            score = match_count / (len(tokens) + 1.0)
            if score >= min_score and match_count > 0:
                scores.append((self.records[i], score))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

    def build_citations(self, scored_records: List[Tuple[LegalRecord, float]]) -> List[SourceCitation]:
        """Converts retrieved records into structured source citations."""
        citations = []
        for rec, score in scored_records:
            citations.append(SourceCitation(
                document_id=rec.document_id,
                title=rec.title,
                legal_category=rec.legal_category,
                act_name=rec.act_name,
                section_number=rec.section_number,
                provision_title=rec.provision_title,
                official_source_name=rec.official_source_name,
                official_source_url=rec.official_source_url,
                relevant_text=rec.source_text[:350],
                verification_status=rec.verification_status,
                score=round(score, 4)
            ))
        return citations

    def get_all_categories(self) -> List[str]:
        """Returns distinct legal categories available in the knowledge base."""
        cats = sorted(list(set(r.legal_category for r in self.records)))
        return cats

    def search_by_category(self, category: str) -> List[LegalRecord]:
        """Filters legal records by category."""
        return [r for r in self.records if r.legal_category.lower() == category.lower()]

    def get_record_by_id(self, doc_id: str) -> LegalRecord:
        """Finds a legal record by ID."""
        for r in self.records:
            if r.document_id.lower() == doc_id.lower():
                return r
        return None

# Singleton instance
legal_retrieval_service = LegalRetrievalService()
