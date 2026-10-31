"""
Chat and Legal Q&A API Router for LegalSaathi AI.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse, SourceCitation
from app.services.legal_retrieval import legal_retrieval_service
from app.services.translation_service import translation_service
from app.services.ai_service import ai_service
from app.utils.emergency import detect_emergency
from app.utils.text_helpers import sanitize_user_text
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["Chat"])

LEGAL_DISCLAIMER = (
    "This AI assistant provides general legal information for awareness and educational purposes only. "
    "It is not a lawyer and does not provide professional legal advice. "
    "Laws and procedures may depend on your location and circumstances. "
    "Please consult a qualified lawyer or an appropriate legal-services authority (NALSA Helpline: 15100) for advice about your specific situation."
)

@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    """
    Main conversational endpoint:
    1. Sanitizes user input
    2. Resolves language (en / hi / kn)
    3. Scans for urgent emergencies
    4. Retrieves verified legal citations via RAG
    5. Generates AI answer grounded in sources
    6. Returns response with citations, follow-ups, and disclaimer
    """
    sanitized_query = sanitize_user_text(request.query)
    if not sanitized_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # 1. Resolve language
    target_lang, detected_lang = translation_service.resolve_language(
        request.language if not request.auto_detect or request.language != "auto" else None,
        sanitized_query
    )

    # 2. Check emergency
    emergency_contact = detect_emergency(sanitized_query)

    # 3. Retrieve relevant legal records
    scored_records = legal_retrieval_service.retrieve(sanitized_query, top_k=3, min_score=0.04)
    retrieved_records = [rec for rec, _ in scored_records]
    citations = legal_retrieval_service.build_citations(scored_records)

    # 4. Generate AI response
    generation = ai_service.generate_legal_answer(
        query=sanitized_query,
        retrieved_sources=retrieved_records,
        target_lang=target_lang
    )

    # 5. Follow up questions
    follow_ups = translation_service.get_follow_up_questions(target_lang)

    return ChatResponse(
        answer=generation["answer"],
        language=target_lang,
        detected_language=detected_lang,
        sources=citations,
        follow_up_questions=follow_ups,
        ai_provider=generation["provider"],
        model_used=generation["model"],
        disclaimer=LEGAL_DISCLAIMER,
        emergency_contact=emergency_contact
    )
