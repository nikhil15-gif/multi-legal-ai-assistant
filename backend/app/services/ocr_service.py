"""
OCR Service for LegalSaathi AI.
Extracts text from scanned documents, photos of legal notices, and receipts using Tesseract and Pillow.
"""

import io
from typing import Dict, Any, Optional
from app.utils.logger import logger

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    logger.warning("Pillow library is not installed.")

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract library is not installed.")

class OCRService:
    def is_available(self) -> bool:
        """Checks whether both Pillow and pytesseract are ready."""
        return PIL_AVAILABLE and TESSERACT_AVAILABLE

    def extract_text_from_image_bytes(self, image_bytes: bytes, filename: str = "image.png") -> Dict[str, Any]:
        """
        Extracts text from image bytes using Pillow and Tesseract.
        """
        if not PIL_AVAILABLE:
            return {
                "success": False,
                "text": "",
                "error": "Pillow (PIL) is not installed on the system."
            }

        if not TESSERACT_AVAILABLE:
            return {
                "success": False,
                "text": "",
                "error": "pytesseract is not installed on the system."
            }

        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert RGBA or CMYK to RGB
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")

            # Perform OCR (supports English + Devanagari if installed)
            text = pytesseract.image_to_string(image)
            clean_text = text.strip()

            if not clean_text:
                return {
                    "success": False,
                    "text": "",
                    "error": "No legible text could be extracted from the uploaded image. Please ensure the image is clear and well-lit."
                }

            return {
                "success": True,
                "text": clean_text,
                "error": None
            }
        except Exception as e:
            err_str = str(e)
            if "tesseract is not installed" in err_str.lower() or "not in your path" in err_str.lower():
                return {
                    "success": False,
                    "text": "",
                    "error": (
                        "Tesseract OCR executable is not found in your system PATH. "
                        "On macOS run 'brew install tesseract' or on Windows install Tesseract-OCR."
                    )
                }
            return {
                "success": False,
                "text": "",
                "error": f"Image OCR failed: {err_str}"
            }

ocr_service = OCRService()
