"""
Legal Knowledge Base API Router for LegalSaathi AI.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import LegalRecord, LegalSearchResponse
from app.services.legal_retrieval import legal_retrieval_service

router = APIRouter(prefix="/api/legal", tags=["Legal Knowledge"])

@router.get("/categories", response_model=List[str])
async def get_legal_categories():
    """Returns available legal categories in the curated knowledge base."""
    return legal_retrieval_service.get_all_categories()

@router.get("/search", response_model=LegalSearchResponse)
async def search_legal_knowledge(
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Category filter")
):
    """Searches the Indian legal knowledge base by query and/or category."""
    if category and not q:
        records = legal_retrieval_service.search_by_category(category)
        return LegalSearchResponse(results=records, total=len(records), query="", category=category)

    if q:
        scored = legal_retrieval_service.retrieve(q, top_k=10, min_score=0.01)
        records = [rec for rec, _ in scored]
        if category:
            records = [r for r in records if r.legal_category.lower() == category.lower()]
        return LegalSearchResponse(results=records, total=len(records), query=q, category=category)

    # If neither query nor category, return all records
    records = legal_retrieval_service.records
    return LegalSearchResponse(results=records, total=len(records), query="", category=None)

@router.get("/provisions/{document_id}", response_model=LegalRecord)
async def get_legal_provision(document_id: str):
    """Retrieves full details of a specific legal provision by ID."""
    rec = legal_retrieval_service.get_record_by_id(document_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Legal record '{document_id}' not found.")
    return rec

@router.get("/sources/{document_id}")
async def get_source_metadata(document_id: str):
    """Returns official source metadata and verification details for a citation."""
    rec = legal_retrieval_service.get_record_by_id(document_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Source '{document_id}' not found.")
    return {
        "document_id": rec.document_id,
        "title": rec.title,
        "act_name": rec.act_name,
        "section_number": rec.section_number,
        "official_source_name": rec.official_source_name,
        "official_source_url": rec.official_source_url,
        "verification_status": rec.verification_status,
        "effective_date": rec.effective_date,
        "last_verified_date": rec.last_verified_date
    }
