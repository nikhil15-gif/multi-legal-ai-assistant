"""
Document Processing Service for LegalSaathi AI.
Extracts text from PDF, TXT, PNG, JPG, and JPEG files, with prompt-injection defense and legal summarization.
"""

import io
import os
import uuid
import re
from typing import Dict, Any, List, Optional, Tuple
from app.utils.logger import logger
from app.utils.text_helpers import sanitize_document_content, extract_relevant_excerpts, extract_legal_terms_explained
from app.services.ocr_service import ocr_service

# PyMuPDF
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF (fitz) is not installed.")

# Fallback PyPDF
try:
    from pypdf import PdfReader
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

class DocumentService:
    def __init__(self):
        # In-memory session store for uploaded documents
        self.documents: Dict[str, Dict[str, Any]] = {}

    def validate_file(self, filename: str, file_size: int) -> Tuple[bool, str]:
        """Validates extension and size."""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return False, f"Unsupported file type '{ext}'. Allowed: PDF, TXT, PNG, JPG, JPEG."
        if file_size > MAX_FILE_SIZE_BYTES:
            return False, f"File size exceeds maximum limit of 10MB (file is {file_size / (1024*1024):.2f}MB)."
        return True, ""

    def process_upload(self, filename: str, content: bytes) -> Dict[str, Any]:
        """
        Parses document bytes, extracts text, sanitizes input, and indexes pages.
        """
        valid, msg = self.validate_file(filename, len(content))
        if not valid:
            return {"success": False, "error": msg}
        if not content:
            return {"success": False, "error": "The uploaded file is empty."}

        ext = os.path.splitext(filename)[1].lower()
        doc_id = str(uuid.uuid4())[:8]
        extracted_text = ""
        page_count = 1
        ocr_used = False

        if ext == ".txt":
            try:
                extracted_text = content.decode("utf-8", errors="replace")
            except Exception as e:
                return {"success": False, "error": f"Failed to read TXT file: {str(e)}"}

        elif ext == ".pdf":
            extracted_text, page_count, ocr_used = self._extract_from_pdf(content)

        elif ext in {".png", ".jpg", ".jpeg"}:
            ocr_result = ocr_service.extract_text_from_image_bytes(content, filename)
            if not ocr_result["success"]:
                return {"success": False, "error": ocr_result["error"]}
            extracted_text = ocr_result["text"]
            ocr_used = True

        # Sanitize against prompt injections
        sanitized_text = sanitize_document_content(extracted_text)
        if not sanitized_text.strip():
            if ext == ".pdf" and not ocr_service.is_available():
                return {
                    "success": False,
                    "error": "This PDF has no selectable text and OCR is not available. Install Tesseract OCR and restart the backend."
                }
            if ext == ".pdf":
                return {
                    "success": False,
                    "error": "No readable text could be extracted from this PDF. It may be blank, encrypted, or too blurry for OCR."
                }
            return {"success": False, "error": "No readable text was found in this file. For scanned PDFs, make sure Tesseract OCR is installed and configured."}
        preview = sanitized_text[:300] + ("..." if len(sanitized_text) > 300 else "")

        # Store in memory
        self.documents[doc_id] = {
            "doc_id": doc_id,
            "filename": filename,
            "file_type": ext,
            "raw_text": sanitized_text,
            "page_count": page_count,
            "ocr_used": ocr_used,
            "length": len(sanitized_text)
        }

        return {
            "success": True,
            "doc_id": doc_id,
            "filename": filename,
            "file_type": ext,
            "page_count": page_count,
            "extracted_length": len(sanitized_text),
            "preview_text": preview,
            "ocr_used": ocr_used,
            "message": "Document parsed and indexed successfully."
        }

    def _extract_from_pdf(self, pdf_bytes: bytes) -> tuple:
        """Extracts text using PyMuPDF or pypdf, with OCR fallback."""
        text_parts = []
        page_count = 0
        ocr_used = False

        if PYMUPDF_AVAILABLE:
            try:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                page_count = len(doc)
                for page_idx in range(page_count):
                    page = doc.load_page(page_idx)
                    page_text = page.get_text()
                    if page_text.strip():
                        text_parts.append(f"[Page {page_idx+1}]\n{page_text}")
                    elif ocr_service.is_available():
                        # Scanned PDF page: attempt pixmap OCR
                        # Render scanned pages at a more OCR-friendly resolution.
                        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                        img_bytes = pix.tobytes("png")
                        ocr_res = ocr_service.extract_text_from_image_bytes(img_bytes)
                        if ocr_res["success"]:
                            text_parts.append(f"[Page {page_idx+1} (OCR)]\n{ocr_res['text']}")
                            ocr_used = True
            except Exception as e:
                logger.error(f"PyMuPDF error: {e}")

        elif PYPDF_AVAILABLE and not text_parts:
            try:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                page_count = len(reader.pages)
                for idx, page in enumerate(reader.pages):
                    t = page.extract_text() or ""
                    if t.strip():
                        text_parts.append(f"[Page {idx+1}]\n{t}")
            except Exception as e:
                logger.error(f"PyPDF error: {e}")

        full_text = "\n\n".join(text_parts).strip()
        return full_text, max(page_count, 1), ocr_used

    def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        return self.documents.get(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        if doc_id in self.documents:
            del self.documents[doc_id]
            return True
        return False

    def ask_document(self, doc_id: str, question: str, language: str = "en") -> Dict[str, Any]:
        """
        Answers a user question grounded strictly in the uploaded document.
        """
        doc = self.get_document(doc_id)
        if not doc:
            return {
                "success": False,
                "error": f"Document ID '{doc_id}' not found or session expired."
            }

        text = doc["raw_text"]
        if not text:
            return {
                "success": False,
                "error": "The uploaded document contains no extractable text."
            }

        excerpts = extract_relevant_excerpts(text, question, max_excerpts=3)
        legal_terms = extract_legal_terms_explained(text)

        # Grounded answer synthesis
        top_context = "\n---\n".join(excerpts)
        if not top_context.strip():
            top_context = text[:800]

        if excerpts:
            answer = (
                f"Based on the text extracted from **{doc['filename']}**, these passages may be relevant:\n\n"
                + "\n\n".join(f"> {excerpt}" for excerpt in excerpts)
                + "\n\nThis is an extractive result, not a legal interpretation. Check the full clause and surrounding pages; OCR or text extraction may omit context."
            )
        else:
            answer = (
                f"I could not find a passage in **{doc['filename']}** that clearly answers this question. "
                "The document text may use different wording, or extraction may have missed the relevant section. Please review the full document."
            )

        return {
            "success": True,
            "doc_id": doc_id,
            "question": question,
            "answer": answer,
            "language": language,
            "relevant_excerpts": excerpts,
            "legal_terms_explained": legal_terms
        }

    def summarize_document(self, doc_id: str, language: str = "en") -> Dict[str, Any]:
        """
        Summarizes the document nature, parties, obligations, and risks.
        """
        doc = self.get_document(doc_id)
        if not doc:
            return {"success": False, "error": f"Document ID '{doc_id}' not found."}

        text = doc["raw_text"]
        if not text:
            return {"success": False, "error": "Document contains no text to summarize."}

        # Classify document nature heuristically
        text_lower = text.lower()
        if "agreement" in text_lower or "contract" in text_lower or "party of the first part" in text_lower:
            doc_type = "Contractual Agreement / Deed"
        elif "lease" in text_lower or "rent" in text_lower or "tenancy" in text_lower:
            doc_type = "Tenancy / Lease Agreement"
        elif "notice" in text_lower or "legal notice" in text_lower:
            doc_type = "Legal Demand Notice"
        elif "court" in text_lower or "petition" in text_lower or "affidavit" in text_lower:
            doc_type = "Court Proceeding / Affidavit"
        else:
            doc_type = "General Legal Correspondence"

        # Extract parties
        parties = []
        party_matches = re.findall(r"(?:between|party\s+of\s+the\s+\w+\s+part:?)\s+([A-Z][a-zA-Z\s\.,]+)", text[:1500])
        if party_matches:
            parties = [p.strip() for p in party_matches[:2]]
        else:
            parties = ["Identified in document preamble"]

        # Report only clauses present in the extracted text. These are search
        # leads, not conclusions about enforceability or legal effect.
        clauses = [part.strip() for part in re.split(r"(?<=[.!?])\s+|\n+", text) if part.strip()]
        obligation_terms = re.compile(r"\b(shall|must|agrees? to|is required to|will pay|liable to|undertakes? to)\b", re.I)
        caution_terms = re.compile(r"\b(terminate|termination|penalty|forfeit|forfeiture|indemnif|liabilit|arbitrat|jurisdiction|notice period|default)\w*\b", re.I)
        obligations = list(dict.fromkeys(sentence for sentence in clauses if obligation_terms.search(sentence)))[:6]
        risks = list(dict.fromkeys(sentence for sentence in clauses if caution_terms.search(sentence)))[:6]
        if not obligations:
            obligations = ["No clear obligation wording was identified in the extracted text."]
        if not risks:
            risks = ["No specific risk clause was identified by the text scan. Review the complete document and seek qualified advice where needed."]

        summary = (
            f"This document is classified as a **{doc_type}** spanning {doc['page_count']} page(s) and {doc['length']} characters. "
            "The items below are passages selected from the extracted text for review; they do not determine legal effect or enforceability."
        )

        return {
            "success": True,
            "doc_id": doc_id,
            "summary": summary,
            "document_nature": doc_type,
            "parties_involved": parties,
            "key_obligations": obligations,
            "potential_risks_or_cautions": risks,
            "language": language
        }

document_service = DocumentService()
