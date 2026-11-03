import React, { useEffect, useState } from 'react';
import { Scale, Copy, Check, Sparkles, BookOpen, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import SourceCard from './SourceCard';
import MarkdownContent from './MarkdownContent';

export default function ChatMessage({ message, onSelectFollowUp }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechPlaybackError, setSpeechPlaybackError] = useState('');
  const [speechVoices, setSpeechVoices] = useState([]);
  const modelLabel = /knowledge base fallback|grounded-kb-synthesizer/i.test(message.modelUsed || '')
    ? 'Verified legal knowledge base'
    : message.modelUsed;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
    const speech = window.speechSynthesis;
    const updateVoices = () => setSpeechVoices(speech.getVoices());
    updateVoices();
    speech.addEventListener?.('voiceschanged', updateVoices);
    return () => {
      speech.removeEventListener?.('voiceschanged', updateVoices);
      speech.cancel();
    };
  }, []);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSpeak = () => {
    const speech = window.speechSynthesis;
    if (!speech || !message.content) return;
    setSpeechPlaybackError('');
    if (isSpeaking) {
      speech.cancel();
      setIsSpeaking(false);
      return;
    }

    speech.cancel();
    const plainText = String(message.content)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/[*_~`>#]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = { hi: 'hi-IN', kn: 'kn-IN' }[message.language] || 'en-IN';
    const languageCode = (message.language || 'en').toLowerCase();
    const availableVoices = speechVoices.length ? speechVoices : speech.getVoices();
    const matchingVoice = availableVoices.find((voice) => voice.lang.toLowerCase() === utterance.lang.toLowerCase())
      || availableVoices.find((voice) => voice.lang.toLowerCase().split('-')[0] === languageCode);
    if (!availableVoices.length) {
      setSpeechPlaybackError('Browser speech voices are still loading. Wait a moment, then tap Listen again.');
      return;
    }
    if (availableVoices.length && !matchingVoice) {
      const languageName = { en: 'English', hi: 'Hindi', kn: 'Kannada' }[languageCode] || 'requested language';
      setSpeechPlaybackError(`No ${languageName} speech voice is available in this browser. Add that voice in your device settings, then try again.`);
      return;
    }
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setSpeechPlaybackError('Audio playback could not start. Check your device sound and browser speech settings.');
      }
    };
    speech.speak(utterance);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="max-w-2xl bg-slate-900 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-slate-400">{message.timestamp || 'Just now'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3 mb-6 animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-teal-600 flex-shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
        <Scale className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-sm space-y-4">
        {/* Header / Meta */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">LegalSaathi AI</span>
            {modelLabel && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {modelLabel}
              </span>
            )}
            {message.language && (
              <span className="text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 px-2 py-0.5 rounded-full uppercase font-medium">
                {message.language}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <button
                onClick={handleSpeak}
                className="text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 p-1 rounded-md transition flex items-center space-x-1 text-xs"
                title={isSpeaking ? 'Stop speaking' : 'Read answer aloud'}
                aria-label={isSpeaking ? 'Stop speaking' : 'Read answer aloud'}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>
            )}
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition flex items-center space-x-1 text-xs"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Emergency Alert Box inside message if present */}
        {message.emergencyContact?.is_emergency && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-900 rounded-xl p-3 text-xs text-red-800 dark:text-red-200 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">IMMEDIATE EMERGENCY CONTACTS: </strong>
              <span>Call <strong>112</strong> for Police/Medical or <strong>1091</strong> for Women Helpline immediately.</span>
            </div>
          </div>
        )}

        {/* Formatted Answer Body */}
        {speechPlaybackError && (
          <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
            {speechPlaybackError}
          </p>
        )}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          <MarkdownContent content={message.content} />
        </div>

        {/* Verified Sources Accordion */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-1.5 mb-2.5">
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Verified Statutory Sources ({message.sources.length})
              </h4>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {message.sources.map((src, idx) => (
                <SourceCard key={src.document_id || idx} citation={src} />
              ))}
            </div>
          </div>
        )}

        {/* Follow-up Questions Chips */}
        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" />
              Suggested Follow-up Questions:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.followUpQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectFollowUp && onSelectFollowUp(q)}
                  className="text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
