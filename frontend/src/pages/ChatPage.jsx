import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Scale, 
  AlertCircle, 
  Languages, 
  FileText,
  Volume2
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import VoiceInputButton from '../components/VoiceInputButton';
import EmergencyModal from '../components/EmergencyModal';
import { sendChatMessage } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { TRANSLATIONS } from '../services/i18n';

export default function ChatPage({ 
  currentLang, 
  setCurrentLang, 
  initialPrompt, 
  onClearInitialPrompt 
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: (
        "Namaste! I am **LegalSaathi AI**, your Indian Legal Rights Awareness Assistant.\n\n"
        + "You can ask me questions about **Consumer Rights**, **Land Disputes (Haddubastu / Encroachment)**, **FIR Procedures (Zero FIR & BNSS 2023)**, **Women's Rights (PWDVA / POSH)**, **Labour & Unpaid Wages**, or **Cybercrime (1930 Portal)**.\n\n"
        + "Feel free to ask in **English**, **हिन्दी**, or **ಕನ್ನಡ**."
      ),
      modelUsed: "LegalSaathi Engine",
      language: currentLang,
      sources: [],
      followUpQuestions: [
        "What are my rights if my employer refuses to pay my salary?",
        "दुकानदार खराब सामान दे तो रिफंड कैसे लें?",
        "ಭೂಮಿಯ ಗಡಿ ವಿವಾದವಾದರೆ ಏನು ಮಾಡಬೇಕು?"
      ],
      timestamp: 'Now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [chatError, setChatError] = useState(null);

  const messagesEndRef = useRef(null);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  // Voice recognition hook
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: speechSupported,
    startListening,
    stopListening
  } = useSpeechRecognition(currentLang);

  // Sync voice transcript to input text
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Handle incoming initial prompt from Homepage cards
  useEffect(() => {
    if (initialPrompt) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setChatError(null);
    setInputText('');

    // Append user message
    const userMsg = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build lightweight recent history
      const historyPayload = messages.slice(-4).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendChatMessage(query, currentLang, historyPayload);

      // Check for emergency guidance
      if (res.emergency_contact && res.emergency_contact.is_emergency) {
        setActiveEmergency(res.emergency_contact);
      }

      const botMsg = {
        role: 'assistant',
        content: res.answer,
        language: res.language,
        modelUsed: `${res.model_used} (${res.ai_provider})`,
        sources: res.sources || [],
        followUpQuestions: res.follow_up_questions || [],
        emergencyContact: res.emergency_contact,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatError(err.message || "Failed to reach backend service.");
      const errorBotMsg = {
        role: 'assistant',
        content: (
          `⚠️ **Unable to complete inquiry**: ${err.message}\n\n`
          + "Please verify that the backend server is running on `http://localhost:8000`. "
          + "If you are running Ollama locally, ensure `ollama serve` is active."
        ),
        modelUsed: "Error Handler",
        sources: [],
        followUpQuestions: ["Check system health", "How to install Ollama model?"],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorBotMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear current conversation history?")) {
      setMessages([messages[0]]);
      setChatError(null);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto py-2">
      {/* Emergency Modal Popup */}
      <EmergencyModal 
        emergencyData={activeEmergency} 
        onClose={() => setActiveEmergency(null)} 
      />

      {/* Chat Header Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 px-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-800 text-teal-400 flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Legal Consultation Chat</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounded in Indian statutory codes with source citations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Language Switcher */}
          <div className="flex items-center text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentLang('en')}
              className={`px-2 py-0.5 rounded font-medium transition ${currentLang === 'en' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'}`}
            >
              EN
            </button>
            <button
              onClick={() => setCurrentLang('hi')}
              className={`px-2 py-0.5 rounded font-medium transition ${currentLang === 'hi' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'}`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setCurrentLang('kn')}
              className={`px-2 py-0.5 rounded font-medium transition ${currentLang === 'kn' ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-xs' : 'text-slate-500'}`}
            >
              ಕನ್ನಡ
            </button>
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage 
            key={index} 
            message={msg} 
            onSelectFollowUp={(q) => handleSendMessage(q)} 
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center space-x-3 mb-4 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center space-x-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Searching India Code & analyzing legal statutes...
              </span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice Warning or Error Banner */}
      {speechError && (
        <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mb-2">
          {speechError}
        </div>
      )}

      {/* Input Box Footer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-2 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition"
        >
          {/* Voice Input Button */}
          <VoiceInputButton
            isListening={isListening}
            isSupported={speechSupported}
            onToggle={toggleVoice}
            language={currentLang}
          />

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? t.listening : t.chatPlaceholder}
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none px-2"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className={`p-2.5 rounded-xl text-white transition-all flex items-center justify-center ${
              !inputText.trim() || isLoading
                ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/20 hover:scale-105'
            }`}
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-1.5">
          General awareness guidance. Citations link to official India Code provisions.
        </p>
      </div>
    </div>
  );
}
