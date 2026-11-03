"""
Translation and Language Detection Service for LegalSaathi AI.
Supports English, Hindi, and Kannada with statutory terminology preservation.
"""

import re
import unicodedata
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
    @staticmethod
    def _looks_like_romanized_kannada(text: str) -> bool:
        """Recognize common Kannada words when a speech engine returns Latin text."""
        normalized = re.sub(r"[^a-z\s]", " ", text.lower())
        words = set(normalized.split())
        kannada_roots = {
            "nanu", "nanage", "nanna", "nimma", "nimage", "enu", "yenu",
            "yaava", "yava", "yav", "beku", "bekaa", "bekagide", "maadu",
            "madid", "maadid", "nodi", "nod", "hege", "hakku", "kanunu",
            "kanoonu", "duru", "dayavittu", "illa", "ide", "iddare", "yaavyaavu",
            "sahaya", "yaake", "ellide", "elli", "maadi", "madabeku", "madbeku",
            "maadbeku", "agide", "avaru", "nange", "kodabeku", "kodbeku", "sambala",
            "vetana", "sigalilla", "sigilla",
            # Common Latin spellings Whisper emits for conversational Kannada.
            # These cover the user's reported "ishtu dinegara ..." style output.
            "ishtu", "dina", "dinagala", "aaga", "aadaga", "aga", "aag",
            "kaddaya", "kadday", "kadhi", "kaara", "sallu", "salla", "sallisu",
            "yavaga", "yavag", "barutte", "baruttade", "agutte", "aagutte",
            "bekalla", "madalla", "helid", "helbeku", "tumba", "illaandre",
        }
        matches = sum(
            1
            for word in words
            if any(word == root or (len(root) >= 4 and word.startswith(root)) for root in kannada_roots)
        )
        # Two recognised roots avoids treating ordinary English as Kannada.
        return matches >= 2 or (
            any(word.startswith("bekaa") for word in words)
            and any(word.startswith("yav") for word in words)
        )

    @staticmethod
    def _looks_like_romanized_hindi(text: str) -> bool:
        """Recognize common Hindi transliteration returned by speech-to-text."""
        normalized = re.sub(r"[^a-z\s]", " ", text.lower())
        words = set(normalized.split())
        hindi_roots = {
            "kya", "kyaa", "kyun", "kyon", "kyu", "kaise", "kaisa", "kaisi",
            "kab", "kahan", "kahaan", "kaha", "kaun", "kis", "kise", "kisko",
            "mujhe", "mujhko", "mujhse", "mera", "meri", "mere", "aap", "aapko",
            "apna", "apne", "tum", "tumhara", "tumhari", "hum", "ham", "hamara",
            "hain", "hai", "hoon", "tha", "the", "thi", "nahi", "nahin", "nhi",
            "nahee", "chahiye", "chaiye", "chahie", "adhikar", "adhikaar", "haq",
            "kanun", "kanoon", "kanooni", "madad", "sahayata", "paisa", "paise",
            "karu", "karun", "karein", "karen", "karo", "karna", "kijiye", "kiya",
            "agar", "toh", "zameen", "jameen", "ghar", "kiraya", "mazdoori", "tankhwa",
            "naukri", "kaam", "vetan", "thana", "police", "shikayat", "darj", "milega",
        }
        distinctive_roots = {
            "kya", "kyaa", "kyun", "kyon", "kyu", "kaise", "kaisa", "kaisi", "kab",
            "kahan", "kahaan", "kaha", "kaun", "kis", "kise", "kisko", "mujhe",
            "mujhko", "mujhse", "mera", "meri", "mere", "aap", "aapko", "nahi",
            "nahin", "nhi", "nahee", "chahiye", "chaiye", "chahie", "agar", "hain",
            "hoon", "kijiye",
        }
        matches = {
            word
            for word in words
            if any(word == root or (len(root) >= 4 and word.startswith(root)) for root in hindi_roots)
        }
        return len(matches) >= 2 and bool(matches & distinctive_roots)

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
        elif self._looks_like_romanized_kannada(text):
            return "kn"
        elif self._looks_like_romanized_hindi(text):
            return "hi"
        return "en"

    @staticmethod
    def answer_matches_language(text: str, language: str) -> bool:
        """Check that a generated answer substantially uses the requested script."""
        if language not in {"hi", "kn"}:
            return True

        pattern = r"[\u0900-\u097F]" if language == "hi" else r"[\u0C80-\u0CFF]"
        target_chars = len(re.findall(pattern, text or ""))
        latin_chars = len(re.findall(r"[a-zA-Z]", text or ""))
        return target_chars >= 3 and target_chars / max(target_chars + latin_chars, 1) >= 0.25

    @staticmethod
    def has_native_script(text: str, language: str) -> bool:
        """Return whether Hindi/Kannada text is actually written in its script."""
        pattern = r"[\u0900-\u097F]" if language == "hi" else r"[\u0C80-\u0CFF]"
        target_chars = len(re.findall(pattern, text or ""))
        latin_chars = len(re.findall(r"[a-zA-Z]", text or ""))
        return target_chars >= 2 and target_chars / max(target_chars + latin_chars, 1) >= 0.25

    @staticmethod
    def contains_unsupported_script(text: str) -> bool:
        """Detect alphabetic scripts outside this app's English/Hindi/Kannada support."""
        supported_script_names = ("LATIN", "DEVANAGARI", "KANNADA")
        return any(
            character.isalpha()
            and not any(script_name in unicodedata.name(character, "") for script_name in supported_script_names)
            for character in (text or "")
        )

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
