"""
AI Status, Language, and Emergency API Router for LegalSaathi AI.
"""

from typing import List, Dict
from fastapi import APIRouter
from app.models.schemas import AIStatusResponse, LanguageItem
from app.services.ai_service import ai_service
from app.services.translation_service import SUPPORTED_LANGUAGES
from app.utils.emergency import OFFICIAL_HELPLINES

router = APIRouter(prefix="/api", tags=["AI & System"])

@router.get("/ai/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Checks local Ollama service, model installation, and configured providers."""
    status = ai_service.get_status()
    return AIStatusResponse(
        provider=status["provider"],
        ollama_reachable=status["ollama_reachable"],
        target_model_installed=status["target_model_installed"],
        ollama_models=status["ollama_models"],
        active_model=status["active_model"],
        is_ready=status["is_ready"],
        message=status["message"],
        optional_providers=status["optional_providers"]
    )

@router.get("/languages", response_model=List[LanguageItem])
async def get_supported_languages():
    """Returns supported languages: English, Hindi, Kannada."""
    return [
        LanguageItem(code=code, name=meta["name"], native_name=meta["native_name"])
        for code, meta in SUPPORTED_LANGUAGES.items()
    ]

@router.get("/emergency/contacts", response_model=Dict[str, str])
async def get_emergency_contacts():
    """Returns official verified 24x7 government helplines across India."""
    return OFFICIAL_HELPLINES
