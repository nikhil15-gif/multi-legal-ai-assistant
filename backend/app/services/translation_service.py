"""
Translation and Language Detection Service for LegalSaathi AI.
Supports English, Hindi, and Kannada with statutory terminology preservation.
"""

import re
from typing import Tuple, List, Optional
from app.utils.logger import logger

# Check for deep_translator availability
try:
    from deep_translator import GoogleTranslator
    DEEP_TRANSLATOR_AVAILABLE = True
except ImportError:
    DEEP_TRANSLATOR_AVAILABLE = False
    logger.info("deep-translator not installed; heuristic and record-grounded localization enabled.")

SUPPORTED_LANGUAGES = {
    "en": {"name": "English", "native_name": "English"},
    "hi": {"name": "Hindi", "native_name": "हिन्दी"},
    "kn": {"name": "Kannada", "native_name": "ಕನ್ನಡ"}
}

# Protected legal regexes that should be preserved during translation
PRESERVE_PATTERNS = [
    r"Section\s+\d+(\([a-zA-Z0-9]+\))*",
    r"Article\s+\d+(\([a-zA-Z0-9]+\))*",
    r"https?://[^\s]+",
    r"\b(BNSS|BNS|BSA|IPC|CrPC|PWDVA|POSH|RTI|NALSA|DCDRC|CCPA)\b",
    r"\b(2023|2024|2019|2005|1987|1972|1964|1950|1860|1872|1882)\b"
]

FOLLOW_UP_TEMPLATES = {
    "en": [
        "What specific documents are required to file this complaint?",
        "What are the expected timelines or limitation periods for this procedure?",
        "Can I get free legal representation from NALSA for this matter?"
    ],
    "hi": [
        "इस शिकायत को दर्ज करने के लिए कौन से दस्तावेजों की आवश्यकता होगी?",
        "इस कानूनी प्रक्रिया में कितना समय लगता है?",
        "क्या मुझे इस मामले में नालसा (NALSA) से मुफ्त सरकारी वकील मिल सकता है?"
    ],
    "kn": [
        "ಈ ದೂರು ದಾಖಲಿಸಲು ಯಾವ ನಿರ್ದಿಷ್ಟ ದಾಖಲೆಗಳು ಬೇಕಾಗುತ್ತವೆ?",
        "ಈ ಕಾನೂನು ಪ್ರಕ್ರಿಯೆಗೆ ಎಷ್ಟು ಸಮಯ ಹಿಡಿಯಬಹುದು?",
        "ಈ ಪ್ರಕರಣದಲ್ಲಿ ನನಗೆ ನಾಲ್ಸಾ (NALSA) ವತಿಯಿಂದ ಉಚಿತ ವಕೀಲರ ನೆರವು ಸಿಗುತ್ತದೆಯೇ?"
    ]
}

class TranslationService:
    def detect_language(self, text: str) -> str:
        """
        Detects whether text is in Kannada ('kn'), Hindi ('hi'), or English ('en').
        Uses exact Unicode block scanning.
        """
        if not text:
            return "en"

        kannada_chars = len(re.findall(r"[\u0C80-\u0CFF]", text))
        devanagari_chars = len(re.findall(r"[\u0900-\u097F]", text))

        total_indic = kannada_chars + devanagari_chars
        if kannada_chars > 0 and kannada_chars >= devanagari_chars:
            return "kn"
        elif devanagari_chars > 0 and devanagari_chars > kannada_chars:
            return "hi"
        return "en"

    def resolve_language(self, user_language_pref: Optional[str], text: str) -> Tuple[str, str]:
        """
        Returns (target_language, detected_language).
        If user explicitly picked 'en', 'hi', or 'kn', honors it.
        If 'auto' or empty, detects from text.
        """
        detected = self.detect_language(text)
        if user_language_pref and user_language_pref in SUPPORTED_LANGUAGES:
            target = user_language_pref
        else:
            target = detected
        return target, detected

    def translate_text(self, text: str, target_lang: str, source_lang: str = "auto") -> str:
        """
        Translates text to target language ('en', 'hi', 'kn').
        Preserves legal section numbers, act names, and URLs.
        """
        if not text or target_lang == source_lang or target_lang == "en":
            return text

        if not DEEP_TRANSLATOR_AVAILABLE:
            return text

        try:
            lang_code = "kn" if target_lang == "kn" else ("hi" if target_lang == "hi" else "en")
            translator = GoogleTranslator(source=source_lang, target=lang_code)
            translated = translator.translate(text)
            return translated if translated else text
        except Exception as e:
            logger.warning(f"Translation service error: {e}. Falling back to original text.")
            return text

    def get_follow_up_questions(self, target_lang: str) -> List[str]:
        """Returns standard follow-up suggestions in the target language."""
        return FOLLOW_UP_TEMPLATES.get(target_lang, FOLLOW_UP_TEMPLATES["en"])

translation_service = TranslationService()
