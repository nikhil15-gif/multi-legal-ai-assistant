import re
from typing import List

# Patterns frequently used in prompt injection attacks against document QA systems
PROMPT_INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+instructions?",
    r"(?i)system\s*prompt",
    r"(?i)you\s+are\s+now\s+(an?\s+)?unrestricted",
    r"(?i)developer\s+mode",
    r"(?i)jailbreak",
    r"(?i)print\s+(all\s+)?api\s*keys?",
    r"(?i)repeat\s+the\s+words\s+above",
]

def sanitize_user_text(text: str) -> str:
    """Sanitizes user query and removes null bytes and unprintable characters."""
    if not text:
        return ""
    # Strip null bytes and non-printable control characters except newlines/tabs
    sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    return sanitized.strip()

def sanitize_document_content(text: str) -> str:
    """
    Cleans document text and neutralizes prompt-injection attempts inside uploaded files.
    """
    if not text:
        return ""
    cleaned = sanitize_user_text(text)
    for pattern in PROMPT_INJECTION_PATTERNS:
        cleaned = re.sub(pattern, "[Filtered unsafe instruction]", cleaned)
    return cleaned

def extract_relevant_excerpts(text: str, query: str, max_excerpts: int = 3, max_chars: int = 300) -> List[str]:
    """
    Finds paragraphs or sentences in document text most relevant to query terms.
    """
    if not text or not query:
        return []

    # Break into sentences or paragraphs
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n|\.\s+", text) if len(p.strip()) > 30]
    if not paragraphs:
        return [text[:max_chars]]

    query_words = set(re.findall(r"\w+", query.lower()))
    scored_paragraphs = []

    for p in paragraphs:
        p_words = set(re.findall(r"\w+", p.lower()))
        common = query_words.intersection(p_words)
        score = len(common)
        if score > 0:
            scored_paragraphs.append((score, p))

    scored_paragraphs.sort(key=lambda x: x[0], reverse=True)
    results = [p[1][:max_chars] for p in scored_paragraphs[:max_excerpts]]
    if not results and paragraphs:
        results = [paragraphs[0][:max_chars]]
    return results

def extract_legal_terms_explained(text: str) -> List[dict]:
    """
    Identifies common Indian legal jargon in documents and provides simple explanations.
    """
    glossary = {
        "indemnity": "A contractual obligation of one party to compensate the other for specified loss or damage.",
        "jurisdiction": "The official power and geographical limit of a court or authority to make legal decisions.",
        "sub-judice": "Under judicial consideration and therefore prohibited from public discussion or parallel decision.",
        "arbitration": "A private dispute resolution process where an independent arbitrator makes a legally binding decision.",
        "injunction": "A formal court order commanding a party to stop doing something or compelling a specific action.",
        "zero fir": "An FIR registered at any police station irrespective of jurisdictional boundary.",
        "cognizable": "An offence where a police officer may arrest without a warrant and investigate without court permission.",
        "duties and liabilities": "Mandatory legal obligations and financial or penal responsibility for failure to comply.",
        "severability": "A contract clause stating that if any part is found illegal, the remaining terms still apply.",
        "encumbrance": "A claim, lien, mortgage, or liability attached to a property that diminishes its value or restricts transfer."
    }

    found = []
    text_lower = text.lower()
    for term, definition in glossary.items():
        if re.search(r"\b" + re.escape(term) + r"\b", text_lower):
            found.append({"term": term.title(), "explanation": definition})
    return found
