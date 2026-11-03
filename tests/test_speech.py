"""Tests for local multilingual speech transcription and mismatch recovery."""

import os
import sys
from types import SimpleNamespace

import pytest

backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_path)

from app.services.speech_service import speech_service


def test_unsupported_transcript_script_retries_with_detected_kannada(monkeypatch):
    languages_seen = []

    class FakeModel:
        def transcribe(self, _path, language=None, **_options):
            languages_seen.append(language)
            if language is None:
                return [SimpleNamespace(text="مجھے میرا سوال پوچھنا ہے")], SimpleNamespace(language="kn")
            return [SimpleNamespace(text="ನನಗೆ ನನ್ನ ಪ್ರಶ್ನೆ ಕೇಳಬೇಕು")], SimpleNamespace(language="kn")

    monkeypatch.setattr(speech_service, "_get_model", lambda: FakeModel())
    text, detected_language = speech_service.transcribe(b"fake audio", "auto", "audio/webm")

    assert languages_seen == [None, "kn"]
    assert text == "ನನಗೆ ನನ್ನ ಪ್ರಶ್ನೆ ಕೇಳಬೇಕು"
    assert detected_language == "kn"


def test_unsupported_transcript_without_supported_audio_guess_is_rejected(monkeypatch):
    class FakeModel:
        def transcribe(self, _path, language=None, **_options):
            return [SimpleNamespace(text="مجھے قانونی مدد چاہیے")], SimpleNamespace(language="ur")

    monkeypatch.setattr(speech_service, "_get_model", lambda: FakeModel())

    with pytest.raises(ValueError, match="English, Hindi, or Kannada"):
        speech_service.transcribe(b"fake audio", "auto", "audio/webm")
