import { useState, useEffect, useCallback, useRef } from 'react';
import { transcribeAudioRecording } from '../services/api';

/** Records a short voice query and sends it to the configured backend transcriber. */
export function useSpeechRecognition(language = 'auto') {
  const [isStarting, setIsStarting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('unknown');
  const [transcript, setTranscript] = useState('');
  const [transcriptLanguage, setTranscriptLanguage] = useState(null);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timeoutRef = useRef(null);

  const isSupported = typeof window !== 'undefined'
    && typeof MediaRecorder !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia);

  const clearRecordingResources = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => () => {
    clearRecordingResources();
  }, [clearRecordingResources]);

  useEffect(() => {
    if (!navigator.permissions?.query) return undefined;
    let mounted = true;
    let permissionStatus;
    navigator.permissions.query({ name: 'microphone' })
      .then((status) => {
        if (!mounted) return;
        permissionStatus = status;
        setMicrophonePermission(status.state);
        status.onchange = () => setMicrophonePermission(status.state);
      })
      .catch(() => {
        // Some browsers do not expose microphone permission state until a request is made.
      });
    return () => {
      mounted = false;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript('');
    setTranscriptLanguage(null);
    if (!isSupported) {
      setError('Microphone recording is unavailable in this browser. Open the app on localhost or HTTPS and try a current Chrome or Edge browser.');
      return;
    }

    try {
      setIsStarting(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      setIsStarting(false);
      setMicrophonePermission('granted');
      streamRef.current = stream;

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setError('The microphone recording failed. Check microphone access and try again.');
        setIsListening(false);
        setIsTranscribing(false);
        clearRecordingResources();
      };
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        chunksRef.current = [];
        setIsListening(false);
        clearRecordingResources();
        if (!audioBlob.size) {
          setError('No audio was recorded. Allow microphone access, then try again.');
          return;
        }

        setIsTranscribing(true);
        try {
          const result = await transcribeAudioRecording(audioBlob, language);
          if (!result.text?.trim()) throw new Error('No speech was detected. Please try again.');
          setTranscript(result.text.trim());
          setTranscriptLanguage(result.language || 'en');
        } catch (err) {
          setError(err.message || 'Voice transcription failed. Please try again or type your question.');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsListening(true);
      // Keep recordings short so questions transcribe quickly and uploads stay small.
      timeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 45000);
    } catch (err) {
      setIsStarting(false);
      clearRecordingResources();
      setIsListening(false);
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        setMicrophonePermission('denied');
        setError('Allow microphone access for this site in your browser, then press the mic again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone was found. Connect a microphone or type your question.');
      } else {
        setError('Could not start microphone recording. Check microphone access and try again.');
      }
    }
  }, [clearRecordingResources, isSupported, language]);

  const stopListening = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === 'recording') recorder.stop();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    isStarting,
    isListening,
    isTranscribing,
    microphonePermission,
    transcript,
    transcriptLanguage,
    error,
    clearError,
    isSupported,
    startListening,
    stopListening
  };
}
