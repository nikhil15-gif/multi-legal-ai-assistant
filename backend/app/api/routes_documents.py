"""
Document Processing and OCR API Router for LegalSaathi AI.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from starlette.concurrency import run_in_threadpool
from app.models.schemas import (
    DocumentUploadResponse,
    DocumentAskRequest,
    DocumentAskResponse,
    DocumentSummarizeRequest,
    DocumentSummarizeResponse
)
from app.services.document_service import document_service, MAX_FILE_SIZE_BYTES

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads and processes legal document or image (PDF, TXT, PNG, JPG, JPEG).
    Extracts text, strips unsafe prompt injections, and indexes in session.
    """
    try:
        # Read at most the configured limit plus one byte so an oversized
        # multipart upload cannot be fully buffered before validation.
        content = await file.read(MAX_FILE_SIZE_BYTES + 1)
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(status_code=413, detail="File size exceeds maximum limit of 10MB.")
        result = await run_in_threadpool(document_service.process_upload, file.filename, content)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return DocumentUploadResponse(
            doc_id=result["doc_id"],
            filename=result["filename"],
            file_type=result["file_type"],
            page_count=result["page_count"],
            extracted_length=result["extracted_length"],
            preview_text=result["preview_text"],
            ocr_used=result["ocr_used"],
            status="ready",
            message=result["message"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process uploaded file: {str(e)}")

@router.post("/ask", response_model=DocumentAskResponse)
async def ask_about_document(request: DocumentAskRequest):
    """Answers questions based exclusively on the uploaded document's text."""
    result = await run_in_threadpool(
        document_service.ask_document,
        request.doc_id,
        request.question,
        request.language or "en",
    )
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])

    return DocumentAskResponse(
        doc_id=result["doc_id"],
        question=result["question"],
        answer=result["answer"],
        language=result["language"],
        relevant_excerpts=result["relevant_excerpts"],
        legal_terms_explained=result["legal_terms_explained"]
    )

@router.post("/summarize", response_model=DocumentSummarizeResponse)
async def summarize_document(request: DocumentSummarizeRequest):
    """Summarizes legal document into nature, parties, obligations, and risks."""
    result = await run_in_threadpool(
        document_service.summarize_document,
        request.doc_id,
        request.language or "en",
    )
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["error"])

    return DocumentSummarizeResponse(
        doc_id=result["doc_id"],
        summary=result["summary"],
        document_nature=result["document_nature"],
        key_obligations=result["key_obligations"],
        potential_risks_or_cautions=result["potential_risks_or_cautions"],
        language=result["language"]
    )

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Deletes uploaded document and cleans up memory."""
    success = document_service.delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    return {"status": "deleted", "doc_id": doc_id, "message": "Document removed successfully."}
