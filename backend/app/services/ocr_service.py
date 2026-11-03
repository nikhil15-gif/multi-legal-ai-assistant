"""
OCR Service for LegalSaathi AI.
Extracts text from scanned documents, photos of legal notices, and receipts using Tesseract and Pillow.
"""

import io
import os
import shutil
from functools import lru_cache
from pathlib import Path
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
    def _tesseract_command(self) -> Optional[str]:
        configured = os.getenv("TESSERACT_CMD")
        if configured and os.path.isfile(configured):
            return configured

        from_path = shutil.which("tesseract")
        if from_path:
            return from_path

        if os.name == "nt":
            common_path = Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "Tesseract-OCR" / "tesseract.exe"
            if common_path.is_file():
                return str(common_path)
        return None

    @lru_cache(maxsize=1)
    def _engine_settings(self):
        """Return the installed engine and the Indian language data available to it."""
        if not PIL_AVAILABLE or not TESSERACT_AVAILABLE:
            return None

        command = self._tesseract_command()
        if not command:
            return None

        pytesseract.pytesseract.tesseract_cmd = command
        try:
            pytesseract.get_tesseract_version()
        except Exception as exc:
            logger.warning("Tesseract OCR executable is unavailable: %s", exc)
            return None

        backend_dir = Path(__file__).resolve().parents[2]
        project_tessdata = backend_dir / "models" / "tessdata"
        configured_tessdata = os.getenv("TESSDATA_PREFIX")
        tessdata_candidates = [
            Path(configured_tessdata) if configured_tessdata else None,
            project_tessdata,
            Path(command).parent / "tessdata",
        ]

        installed_languages = set()
        for tessdata_dir in tessdata_candidates:
            if not tessdata_dir or not tessdata_dir.is_dir():
                continue
            try:
                # Passing --tessdata-dir with a quoted Windows path containing
                # spaces is parsed inconsistently by pytesseract. Tesseract
                # reads this environment variable directly and handles spaces.
                os.environ["TESSDATA_PREFIX"] = str(tessdata_dir)
                installed_languages = set(pytesseract.get_languages())
            except Exception as exc:
                logger.warning("Could not read Tesseract language data from %s: %s", tessdata_dir, exc)
                installed_languages = set()
            if installed_languages.intersection({"eng", "hin", "kan"}):
                break

        requested = [code for code in ("eng", "hin", "kan") if code in installed_languages]
        languages = "+".join(requested) if requested else "eng"
        return command, "", languages, installed_languages

    def is_available(self) -> bool:
        """Checks that Pillow, pytesseract, the native engine, and language data are ready."""
        settings = self._engine_settings()
        return bool(settings and set(settings[3]).intersection({"eng", "hin", "kan"}))

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

        settings = self._engine_settings()
        if not settings:
            return {
                "success": False,
                "text": "",
                "error": "Tesseract OCR is not installed or could not be started. Install Tesseract OCR and restart the backend."
            }

        _, config, languages, _ = settings

        try:
            image = Image.open(io.BytesIO(image_bytes))
            # Convert RGBA or CMYK to RGB
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")

            # Use whichever English, Hindi, and Kannada models are installed.
            text = pytesseract.image_to_string(image, lang=languages, config=config)
            clean_text = text.strip()

            if not clean_text:
                return {
                    "success": False,
                    "text": "",
                    "error": (
                        "No legible text could be extracted from the uploaded image. Use a clear, well-lit image. "
                        "For Hindi or Kannada, install the hin or kan Tesseract language data and try again."
                    )
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
                    "error": "Tesseract OCR could not be started. Install Tesseract or set TESSERACT_CMD to its executable path."
                }
            if "error opening data file" in err_str.lower() or "failed loading language" in err_str.lower():
                return {
                    "success": False,
                    "text": "",
                    "error": f"Tesseract language data is missing. Install the trained data for {languages}."
                }
            return {
                "success": False,
                "text": "",
                "error": f"Image OCR failed: {err_str}"
            }

ocr_service = OCRService()
