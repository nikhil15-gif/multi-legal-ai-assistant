"""Speech transcription API."""

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from starlette.concurrency import run_in_threadpool

import os

from app.services.gemini_speech_service import gemini_speech_service
from app.services.speech_service import MAX_AUDIO_BYTES, speech_service
from app.utils.logger import logger

router = APIRouter(prefix="/api/speech", tags=["Voice"])


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Query("auto", pattern="^(auto|en|hi|kn)$"),
):
    """Transcribes a short recording with the configured speech provider."""
    audio = await file.read(MAX_AUDIO_BYTES + 1)
    await file.close()
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio recording is too large. Please keep it under 20 MB.")

    speech_provider = os.getenv("VOICE_TRANSCRIPTION_PROVIDER", "gemini").strip().lower()
    if speech_provider == "gemini":
        transcriber = gemini_speech_service.transcribe
        provider_name = "gemini"
    elif speech_provider == "local-whisper":
        transcriber = speech_service.transcribe
        provider_name = "local-whisper"
    else:
        raise HTTPException(
            status_code=503,
            detail="Voice transcription provider is not supported. Set VOICE_TRANSCRIPTION_PROVIDER to gemini or local-whisper.",
        )

    try:
        text, detected_language = await run_in_threadpool(
            transcriber,
            audio,
            language,
            file.content_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Voice transcription failed using %s", speech_provider)
        raise HTTPException(
            status_code=503,
            detail="Voice recognition could not process this recording. Please try again or type your question.",
        ) from exc

    if not text:
        raise HTTPException(status_code=422, detail="No speech was detected. Please try again.")
    return {"text": text, "language": detected_language, "provider": provider_name}
