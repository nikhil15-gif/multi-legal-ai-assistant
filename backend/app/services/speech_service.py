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
    _SCRIPT_PROMPTS = {
        "hi": "हिंदी में देवनागरी लिपि में लिखें।",
        "kn": "ಕನ್ನಡವನ್ನು ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ಬರೆಯಿರಿ.",
    }

    def __init__(self):
        self._model = None
        self._model_lock = Lock()

    @staticmethod
    def _read_transcript(segments):
        """Collect text and reject Whisper output with very weak decoding signals."""
        segments = [segment for segment in segments if getattr(segment, "text", "").strip()]
        text = " ".join(segment.text.strip() for segment in segments).strip()
        if not segments:
            return text, False

        average_log_probability = sum(
            getattr(segment, "avg_logprob", 0.0) for segment in segments
        ) / len(segments)
        max_compression_ratio = max(
            (getattr(segment, "compression_ratio", 0.0) for segment in segments),
            default=0.0,
        )
        mostly_silence = all(
            getattr(segment, "no_speech_prob", 0.0) >= 0.8 for segment in segments
        )
        confident = average_log_probability >= -1.0 and max_compression_ratio <= 2.8 and not mostly_silence
        return text, confident

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
            model_name = os.getenv("WHISPER_MODEL", "small")
            logger.info("Loading local speech model '%s'; first use may download model files.", model_name)
            try:
                self._model = WhisperModel(
                    model_name,
                    device="cpu",
                    compute_type="int8",
                    download_root=str(model_dir),
                )
            except Exception:
                if model_name == "base":
                    raise
                logger.exception("Could not load speech model '%s'; falling back to Whisper base.", model_name)
                self._model = WhisperModel(
                    "base",
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
        if "mp4" in mime_type or "m4a" in mime_type:
            suffix = ".mp4"
        elif "wav" in mime_type or "wave" in mime_type:
            suffix = ".wav"
        elif "ogg" in mime_type:
            suffix = ".ogg"
        elif "flac" in mime_type:
            suffix = ".flac"
        else:
            suffix = ".webm"
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_audio:
                temp_audio.write(audio)
                temp_path = temp_audio.name

            model = self._get_model()
            segments, transcription_info = model.transcribe(
                temp_path,
                language=None if language == "auto" else language,
                beam_size=5,
                vad_filter=True,
                initial_prompt=self._SCRIPT_PROMPTS.get(language),
            )
            text, transcript_confident = self._read_transcript(segments)
            detected_from_audio = transcription_info.language
            detected_from_text = translation_service.detect_language(text)

            # The detected script is strongest when the recognizer wrote Hindi
            # or Kannada natively. Romanized Hindi/Kannada detection is useful
            # for choosing a retry, but that Latin text must never be shown as
            # the final transcript for those languages.
            if language != "auto":
                detected_language = language
                retry_language = language
            elif detected_from_text in {"hi", "kn"}:
                detected_language = detected_from_text
                retry_language = detected_from_text
            elif detected_from_audio in CHAT_LANGUAGES:
                detected_language = detected_from_audio
                retry_language = detected_from_audio
            else:
                detected_language = detected_from_text
                retry_language = None

            has_wrong_script = translation_service.contains_unsupported_script(text)
            needs_native_script_retry = (
                retry_language in {"hi", "kn"}
                and not translation_service.has_native_script(text, retry_language)
            )
            needs_quality_retry = not transcript_confident

            # Retry with an explicit language and a native-script cue whenever
            # Hindi/Kannada was recognized but rendered in Latin letters. This
            # also repairs transcripts returned in an unrelated script.
            if has_wrong_script or needs_native_script_retry or needs_quality_retry:
                if retry_language not in CHAT_LANGUAGES:
                    raise ValueError(
                        "Voice input could not be confidently transcribed. "
                        "Speak slowly near the microphone, or type your question."
                    )

                retry_segments, retry_info = model.transcribe(
                    temp_path,
                    language=retry_language,
                    beam_size=8,
                    vad_filter=True,
                    initial_prompt=self._SCRIPT_PROMPTS.get(retry_language),
                )
                retry_text, retry_confident = self._read_transcript(retry_segments)
                retry_is_native = (
                    retry_language not in {"hi", "kn"}
                    or translation_service.has_native_script(retry_text, retry_language)
                )
                if (
                    not retry_text
                    or not retry_confident
                    or translation_service.contains_unsupported_script(retry_text)
                    or not retry_is_native
                ):
                    language_name = {"en": "English", "hi": "Hindi", "kn": "Kannada"}[retry_language]
                    raise ValueError(
                        f"Could not confidently transcribe this recording in {language_name}. "
                        "Please speak slowly and clearly near the microphone, then try again or type your question."
                    )

                logger.info(
                    "Voice transcript script mismatch recovered with a forced '%s' transcription.",
                    retry_info.language,
                )
                return retry_text, retry_language

            if not transcript_confident:
                raise ValueError(
                    "The recording was too unclear to transcribe reliably. "
                    "Speak slowly near the microphone and try again, or type your question."
                )
            return text, detected_language
        finally:
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)


speech_service = LocalSpeechService()
