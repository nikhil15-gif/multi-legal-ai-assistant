import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Trash2,
  Plus,
  History,
  Pencil,
  Check,
  Loader2, 
  Sparkles, 
  Scale,
  X
} from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import VoiceInputButton from '../components/VoiceInputButton';
import EmergencyModal from '../components/EmergencyModal';
import { sendChatMessage } from '../services/api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { TRANSLATIONS } from '../services/i18n';
import { createChatId, loadChatHistory, saveChatHistory } from '../services/chatHistory';

function createWelcomeMessage(language) {
  return {
    role: 'assistant',
    content: (
      "Namaste! I am **LegalSaathi AI**, your Indian Legal Rights Awareness Assistant.\n\n"
      + "You can ask me questions about **Consumer Rights**, **Land Disputes (Haddubastu / Encroachment)**, **FIR Procedures (Zero FIR & BNSS 2023)**, **Women's Rights (PWDVA / POSH)**, **Labour & Unpaid Wages**, or **Cybercrime (1930 Portal)**.\n\n"
      + "Feel free to ask in **English**, **हिन्दी**, or **ಕನ್ನಡ**."
    ),
    modelUsed: 'LegalSaathi Engine',
    language,
    sources: [],
    followUpQuestions: [
      'What are my rights if an employer refuses to pay my salary?',
      'दुकानदार खराब सामान दे तो रिफंड कैसे लें?',
      'ಭೂಮಿಯ ಗಡಿ ವಿವಾದವಾದರೆ ಏನು ಮಾಡಬೇಕು?'
    ],
    timestamp: 'Now'
  };
}

function createInitialChatState(language) {
  const conversations = loadChatHistory();
  const active = conversations[0];
  return {
    conversations,
    activeConversationId: active?.id || createChatId(),
    messages: active?.messages?.length ? active.messages : [createWelcomeMessage(language)]
  };
}

export default function ChatPage({ 
  currentLang, 
  setCurrentLang, 
  initialPrompt, 
  onClearInitialPrompt 
}) {
  const [initialChatState] = useState(() => createInitialChatState(currentLang));
  const [conversations, setConversations] = useState(initialChatState.conversations);
  const [activeConversationId, setActiveConversationId] = useState(initialChatState.activeConversationId);
  const [messages, setMessages] = useState(initialChatState.messages);
  const [inputText, setInputText] = useState('');
  const [voiceInputLanguage, setVoiceInputLanguage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [chatError, setChatError] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyStorageError, setHistoryStorageError] = useState(false);
  const [renamingConversationId, setRenamingConversationId] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');

  const messagesEndRef = useRef(null);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const detectedVoiceLanguage = {
    en: 'English',
    hi: 'Hindi',
    kn: 'Kannada'
  }[voiceInputLanguage];

  // Voice recognition hook
  const {
    isListening,
    isTranscribing,
    transcript,
    transcriptLanguage,
    error: speechError,
    clearError: clearSpeechError,
    isSupported: speechSupported,
    startListening,
    stopListening
  } = useSpeechRecognition('auto');

  // Sync voice transcript to input text
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
      setVoiceInputLanguage(transcriptLanguage);
    }
  }, [transcript, transcriptLanguage]);

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

  useEffect(() => {
    const userMessages = messages.filter((message) => message.role === 'user');
    if (!userMessages.length) return;

    const firstQuestion = userMessages[0].content.replace(/\s+/g, ' ').trim();
    const lastQuestion = userMessages[userMessages.length - 1].content.replace(/\s+/g, ' ').trim();
    setConversations((previous) => {
      const current = previous.find((conversation) => conversation.id === activeConversationId);
      const updated = {
        id: activeConversationId,
        title: current?.title || (firstQuestion.length > 58 ? `${firstQuestion.slice(0, 58)}…` : firstQuestion),
        preview: lastQuestion,
        updatedAt: new Date().toISOString(),
        messages
      };
      return [updated, ...previous.filter((conversation) => conversation.id !== activeConversationId)].slice(0, 50);
    });
  }, [messages, activeConversationId]);

  useEffect(() => {
    try {
      saveChatHistory(conversations);
      setHistoryStorageError(false);
    } catch {
      setHistoryStorageError(true);
    }
  }, [conversations]);

  const handleSendMessage = async (textToSend, requestedLanguage) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;
    // The interface language only changes the UI. Each question selects its
    // response language automatically, including a transcribed voice question.
    const responseLanguage = requestedLanguage || voiceInputLanguage || 'auto';

    setChatError(null);
    setInputText('');
    setVoiceInputLanguage(null);

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

      const res = await sendChatMessage(query, responseLanguage, historyPayload);

      // Check for emergency guidance
      if (res.emergency_contact && res.emergency_contact.is_emergency) {
        setActiveEmergency(res.emergency_contact);
      }

      const botMsg = {
        role: 'assistant',
        content: res.answer,
        language: res.language,
        modelUsed: /knowledge base fallback/i.test(res.ai_provider || '') || res.model_used === 'grounded-kb-synthesizer'
          ? 'Verified legal knowledge base'
          : `${res.model_used} (${res.ai_provider})`,
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

  const startNewChat = () => {
    setActiveConversationId(createChatId());
    setMessages([createWelcomeMessage(currentLang)]);
    setInputText('');
    setChatError(null);
    setActiveEmergency(null);
    setHistoryOpen(false);
  };

  const openConversation = (conversation) => {
    setActiveConversationId(conversation.id);
    setMessages(conversation.messages);
    setInputText('');
    setChatError(null);
    setActiveEmergency(null);
    setHistoryOpen(false);
  };

  const deleteConversation = (event, conversationId) => {
    event.stopPropagation();
    if (!window.confirm('Delete this saved conversation from this browser? This cannot be undone.')) return;
    const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
    setConversations(remaining);
    if (activeConversationId === conversationId) {
      const next = remaining[0];
      setActiveConversationId(next?.id || createChatId());
      setMessages(next?.messages?.length ? next.messages : [createWelcomeMessage(currentLang)]);
      setInputText('');
      setChatError(null);
    }
  };

  const saveConversationTitle = (event, conversationId) => {
    event.preventDefault();
    const title = renameDraft.trim();
    if (title) {
      setConversations((previous) => previous.map((conversation) => (
        conversation.id === conversationId ? { ...conversation, title } : conversation
      )));
    }
    setRenamingConversationId(null);
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
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 px-2">
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            aria-expanded={historyOpen}
            aria-label={`Chat history, ${conversations.length} saved`}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition ${historyOpen ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800' : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            title="Open saved conversations"
          >
            <History className="w-4 h-4" />
            <span>History</span>
            {conversations.length > 0 && <span className="text-[10px] tabular-nums">{conversations.length}</span>}
          </button>
          <button
            type="button"
            onClick={startNewChat}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 transition text-xs font-semibold"
            title="Start a new chat"
            aria-label="New chat"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {historyOpen && (
        <section aria-label="Saved chat history" className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Saved conversations</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Stored only in this browser on this device.</p>
            </div>
            <button type="button" onClick={() => setHistoryOpen(false)} aria-label="Close chat history" className="p-1 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-4 h-4" />
            </button>
          </div>
          {historyStorageError && (
            <p role="status" className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300">Browser storage is unavailable, so new conversations may not be saved.</p>
          )}
          {conversations.length === 0 ? (
            <p className="px-4 py-5 text-xs text-slate-500 dark:text-slate-400">Your conversations will appear here after you ask a question.</p>
          ) : (
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {conversations.map((conversation) => (
                <div key={conversation.id} className={`flex items-center gap-2 px-3 py-2 ${conversation.id === activeConversationId ? 'bg-teal-50/70 dark:bg-teal-950/30' : ''}`}>
                  {renamingConversationId === conversation.id ? (
                    <form onSubmit={(event) => saveConversationTitle(event, conversation.id)} className="min-w-0 flex-1 flex items-center gap-2">
                      <input
                        autoFocus
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        aria-label="Conversation title"
                        maxLength={100}
                        className="min-w-0 flex-1 px-2 py-1.5 text-xs rounded border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      />
                      <button type="submit" aria-label="Save conversation title" className="p-1.5 rounded text-teal-700 hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-900"><Check className="w-4 h-4" /></button>
                      <button type="button" aria-label="Cancel rename" onClick={() => setRenamingConversationId(null)} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConversation(conversation)}
                      className="min-w-0 flex-1 text-left px-1 py-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      aria-label={`Open conversation: ${conversation.title}`}
                    >
                      <span className="block truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{conversation.title || 'Saved conversation'}</span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{conversation.preview}</span>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        {new Date(conversation.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </button>
                  )}
                  {renamingConversationId !== conversation.id && (
                    <button
                      type="button"
                      onClick={() => { setRenamingConversationId(conversation.id); setRenameDraft(conversation.title || ''); }}
                      aria-label={`Rename conversation: ${conversation.title}`}
                      title="Rename saved conversation"
                      className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/40"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(event) => deleteConversation(event, conversation.id)}
                    aria-label={`Delete conversation: ${conversation.title}`}
                    title="Delete saved conversation"
                    className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

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
        <div role="status" className="flex items-center justify-between gap-3 text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 p-2 rounded-lg border border-amber-200 dark:border-amber-800 mb-2">
          <span>{speechError}</span>
          <button
            type="button"
            onClick={clearSpeechError}
            aria-label="Dismiss voice input message"
            className="shrink-0 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
            isTranscribing={isTranscribing}
            isSupported={speechSupported}
            onToggle={toggleVoice}
            language="auto"
          />

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setVoiceInputLanguage(null);
              if (speechError) clearSpeechError();
            }}
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
          {detectedVoiceLanguage
            ? `Detected ${detectedVoiceLanguage}. The answer and voice playback will use ${detectedVoiceLanguage}.`
            : 'Questions in English, Hindi, or Kannada are answered and read aloud in the same language.'}
        </p>
      </div>
    </div>
  );
}
