"""
Main FastAPI application entry point for LegalSaathi AI.
Multilingual Legal Rights Awareness AI Assistant.
"""

import os
from dotenv import load_dotenv

# Load backend environment variables
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_chat import router as chat_router
from app.api.routes_legal import router as legal_router
from app.api.routes_documents import router as documents_router
from app.api.routes_ai import router as ai_router
from app.services.legal_retrieval import legal_retrieval_service
from app.services.ai_service import ai_service
from app.utils.logger import logger

app = FastAPI(
    title="LegalSaathi AI API",
    description="Multilingual Legal Rights Awareness AI Assistant for Indian Citizens",
    version="1.0.0"
)

# Enable CORS for frontend Vite development server (ports 5173, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(chat_router)
app.include_router(legal_router)
app.include_router(documents_router)
app.include_router(ai_router)

@app.get("/")
async def root():
    return {
        "app": "LegalSaathi AI",
        "description": "Multilingual Legal Rights Awareness AI Assistant",
        "version": "1.0.0",
        "docs_url": "/docs",
        "status": "operational"
    }

@app.get("/api/health")
async def health_check():
    """System health check endpoint."""
    ai_status = ai_service.get_status()
    kb_count = len(legal_retrieval_service.records)

    return {
        "status": "healthy",
        "service": "LegalSaathi AI Backend",
        "knowledge_base_records": kb_count,
        "ai_provider": ai_status["provider"],
        "ollama_connected": ai_status["ollama_reachable"],
        "active_model": ai_status["active_model"],
        "ready_for_queries": True
    }

if __name__ == "__main__":
    import uvicorn
    import sys
    # Add backend directory to sys.path
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting LegalSaathi AI Backend on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
