"""
Pydantic schemas and data models for LegalSaathi AI.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'system'")
    content: str = Field(..., description="Message text")
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Legal question asked by user")
    language: Optional[str] = Field("auto", description="'en', 'hi', 'kn', or 'auto'")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Recent conversation turns")
    auto_detect: Optional[bool] = True


class SourceCitation(BaseModel):
    document_id: str
    title: str
    legal_category: str
    act_name: str
    section_number: str
    provision_title: str
    official_source_name: str
    official_source_url: str
    relevant_text: str
    verification_status: str
    score: Optional[float] = None


class EmergencyContact(BaseModel):
    is_emergency: bool = False
    title: Optional[str] = None
    helplines: Optional[Dict[str, str]] = None
    guidance: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    language: str
    detected_language: str
    sources: List[SourceCitation]
    follow_up_questions: List[str]
    ai_provider: str
    model_used: str
    disclaimer: str
    emergency_contact: Optional[EmergencyContact] = None


class LegalRecord(BaseModel):
    document_id: str
    title: str
    legal_category: str
    jurisdiction: str
    act_name: str
    section_number: str
    provision_title: str
    simplified_explanation: str
    simplified_explanation_hi: Optional[str] = None
    simplified_explanation_kn: Optional[str] = None
    source_text: str
    official_source_name: str
    official_source_url: str
    effective_date: Optional[str] = None
    last_verified_date: Optional[str] = None
    verification_status: str
    keywords: Optional[List[str]] = []


class LegalSearchResponse(BaseModel):
    results: List[LegalRecord]
    total: int
    query: str
    category: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    page_count: int
    extracted_length: int
    preview_text: str
    ocr_used: bool
    status: str
    message: str


class DocumentAskRequest(BaseModel):
    doc_id: str
    question: str = Field(..., min_length=1)
    language: Optional[str] = "en"


class DocumentAskResponse(BaseModel):
    doc_id: str
    question: str
    answer: str
    language: str
    relevant_excerpts: List[str]
    legal_terms_explained: List[Dict[str, str]] = []


class DocumentSummarizeRequest(BaseModel):
    doc_id: str
    language: Optional[str] = "en"


class DocumentSummarizeResponse(BaseModel):
    doc_id: str
    summary: str
    document_nature: str
    key_obligations: List[str]
    potential_risks_or_cautions: List[str]
    language: str


class AIStatusResponse(BaseModel):
    provider: str
    ollama_reachable: bool
    ollama_models: List[str]
    active_model: str
    is_ready: bool
    message: str
    optional_providers: Dict[str, bool]


class LanguageItem(BaseModel):
    code: str
    name: str
    native_name: str
