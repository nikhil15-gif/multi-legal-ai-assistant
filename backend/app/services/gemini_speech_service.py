"""Gemini speech-to-text service for English, Hindi, Kannada, and code-switching."""

import base64
import os
from typing import Any, Dict, Optional

import requests

from app.services.translation_service import translation_service


MAX_INLINE_AUDIO_BYTES = 14 * 1024 * 1024
SUPPORTED_MIME_TYPES = {
    "audio/webm": "audio/webm",
    "audio/ogg": "audio/ogg",
    "audio/wav": "audio/wav",
    "audio/x-wav": "audio/wav",
    "audio/mpeg": "audio/mpeg",
    "audio/mp3": "audio/mp3",
    "audio/mp4": "audio/m4a",
    "audio/m4a": "audio/m4a",
    "audio/aac": "audio/aac",
    "audio/flac": "audio/flac",
}


class GeminiSpeechService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_TRANSCRIPTION_MODEL", "gemini-3.5-transcribe").strip()
        self.timeout_seconds = int(os.getenv("GEMINI_TRANSCRIPTION_TIMEOUT_SECONDS", "90"))

    def is_configured(self) -> bool:
        return bool(self.api_key)

    @staticmethod
    def _response_text(data: Dict[str, Any]) -> str:
        output_text = data.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        # The Interactions API represents generated text inside model_output steps.
        for step in data.get("steps", []) or []:
            for content in step.get("content", []) or []:
                text = content.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()

        # Keep compatibility with responses that return typed output blocks.
        for content in data.get("output", []) or []:
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()
        return ""

    def transcribe(
        self,
        audio: bytes,
        language: str = "auto",
        content_type: Optional[str] = None,
    ) -> tuple[str, str]:
        """Return Gemini's verbatim transcript and the transcript's detected language."""
        if not self.is_configured():
            raise RuntimeError(
                "Gemini voice transcription needs an API key. Add GEMINI_API_KEY to backend/.env, then restart the backend."
            )
        if not audio:
            raise ValueError("The recording is empty. Please record your question again.")
        if len(audio) > MAX_INLINE_AUDIO_BYTES:
            raise ValueError("This recording is too large for Gemini voice transcription. Please record a shorter clip.")

        raw_mime_type = (content_type or "audio/webm").split(";", 1)[0].strip().lower()
        mime_type = SUPPORTED_MIME_TYPES.get(raw_mime_type)
        if not mime_type:
            raise ValueError(
                "This recording format is not supported. Use the microphone button again or type your question."
            )

        language_codes = {
            "en": ["en-IN"],
            "hi": ["hi-IN"],
            "kn": ["kn-IN"],
        }.get(language, [])
        payload = {
            "model": self.model,
            "input": [
                {
                    "type": "audio",
                    "data": base64.b64encode(audio).decode("ascii"),
                    "mime_type": mime_type,
                }
            ],
            "generation_config": {
                "transcription_config": {
                    # An empty list enables Gemini's automatic detection and code-switching.
                    "language_codes": language_codes,
                    "mode": {"type": "verbatim"},
                }
            },
        }

        try:
            response = requests.post(
                "https://generativelanguage.googleapis.com/v1beta/interactions",
                headers={
                    "x-goog-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self.timeout_seconds,
            )
        except requests.Timeout as exc:
            raise RuntimeError("Gemini voice transcription timed out. Please try a shorter recording.") from exc
        except requests.RequestException as exc:
            raise RuntimeError(
                "Could not connect to Gemini. Check the internet connection and try again."
            ) from exc

        try:
            data = response.json()
        except ValueError:
            data = {}

        if not response.ok:
            message = (data.get("error") or {}).get("message", "")
            if response.status_code in {401, 403}:
                raise RuntimeError(
                    "Gemini rejected the API key. Check GEMINI_API_KEY in backend/.env and restart the backend."
                )
            if response.status_code == 429:
                raise RuntimeError("Gemini's request limit was reached. Wait a moment and try again.")
            detail = f" {message}" if message else ""
            raise RuntimeError(f"Gemini voice transcription failed (HTTP {response.status_code}).{detail}")

        transcript = self._response_text(data)
        if not transcript:
            raise ValueError("Gemini could not hear clear speech in this recording. Please try again.")

        return transcript, translation_service.detect_language(transcript)


gemini_speech_service = GeminiSpeechService()
