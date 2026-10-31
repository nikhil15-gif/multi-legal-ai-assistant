import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function VoiceInputButton({ isListening, isTranscribing, isSupported, onToggle, language }) {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Voice input is unavailable here. Type your question instead."
        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isTranscribing}
      title={isTranscribing ? 'Transcribing locally…' : isListening ? 'Stop recording' : language === 'auto' ? 'Record a voice question in English, Hindi, or Kannada' : `Record a ${language.toUpperCase()} voice question`}
      className={`relative p-2.5 rounded-xl transition-all flex items-center justify-center focus:outline-none ${
        isListening
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 ring-4 ring-red-200 dark:ring-red-950 animate-pulse'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {isTranscribing
        ? <Loader2 className="w-5 h-5 animate-spin" />
        : <Mic className={`w-5 h-5 ${isListening ? 'animate-bounce' : ''}`} />}
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </span>
      )}
    </button>
  );
}
