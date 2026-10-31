"""Local speech-to-text service for short multilingual voice queries."""

import os
import tempfile
from pathlib import Path
from threading import Lock
from typing import Optional, Tuple

from app.utils.logger import logger
from app.services.translation_service import SUPPORTED_LANGUAGES as CHAT_LANGUAGES, translation_service


MAX_AUDIO_BYTES = 20 * 1024 * 1024
SUPPORTED_LANGUAGES = {"en", "hi", "kn"}


class LocalSpeechService:
    def __init__(self):
        self._model = None
        self._model_lock = Lock()

    def _get_model(self):
        if self._model is not None:
            return self._model

        with self._model_lock:
            if self._model is not None:
                return self._model

            try:
                from faster_whisper import WhisperModel
            except ImportError as exc:
                raise RuntimeError(
                    "Local voice recognition is not installed. Install backend requirements and restart the server."
                ) from exc

            backend_dir = Path(__file__).resolve().parents[2]
            model_dir = Path(os.getenv("WHISPER_MODEL_DIR", str(backend_dir / "models" / "whisper")))
            model_dir.mkdir(parents=True, exist_ok=True)
            model_name = os.getenv("WHISPER_MODEL", "base")
            logger.info("Loading local speech model '%s'; first use may download model files.", model_name)
            self._model = WhisperModel(
                model_name,
                device="cpu",
                compute_type="int8",
                download_root=str(model_dir),
            )
            logger.info("Local speech model '%s' is ready.", model_name)
        return self._model

    def transcribe(self, audio: bytes, language: str, content_type: Optional[str] = None) -> Tuple[str, str]:
        if language != "auto" and language not in SUPPORTED_LANGUAGES:
            raise ValueError("Language must be auto, en, hi, or kn.")
        if not audio:
            raise ValueError("No audio was received. Please record your question and try again.")
        if len(audio) > MAX_AUDIO_BYTES:
            raise ValueError("Audio recording is too large. Please keep it under 20 MB.")

        mime_type = (content_type or "").lower()
        suffix = ".mp4" if "mp4" in mime_type or "m4a" in mime_type else ".webm"
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_audio:
                temp_audio.write(audio)
                temp_path = temp_audio.name

            model = self._get_model()
            segments, transcription_info = model.transcribe(
                temp_path,
                language=None if language == "auto" else language,
                beam_size=3,
                vad_filter=True,
            )
            text = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
            detected_from_audio = transcription_info.language
            detected_from_text = translation_service.detect_language(text)
            # Whisper can label Kannada speech as English when it emits a Latin
            # transliteration. Prefer the Kannada text signal in that case.
            if detected_from_audio not in CHAT_LANGUAGES or (
                detected_from_audio == "en" and detected_from_text == "kn"
            ):
                detected_language = detected_from_text
            else:
                detected_language = detected_from_audio
            return text, detected_language
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)


speech_service = LocalSpeechService()
