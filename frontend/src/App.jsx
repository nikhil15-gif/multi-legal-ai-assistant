import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisclaimerBanner from './components/DisclaimerBanner';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import KnowledgePage from './pages/KnowledgePage';
import DocumentPage from './pages/DocumentPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';
import { useTheme } from './hooks/useTheme';
import { fetchAiStatus } from './services/api';
import { Scale, Heart, ShieldAlert, PhoneCall } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('legalsaathi_lang') || 'en';
  });
  const [aiStatus, setAiStatus] = useState(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem('legalsaathi_lang', currentLang);
  }, [currentLang]);

  const loadAiStatus = async () => {
    try {
      const status = await fetchAiStatus();
      setAiStatus(status);
    } catch (err) {
      console.warn("Failed to reach AI status endpoint:", err);
      setAiStatus({
        provider: 'ollama',
        ollama_reachable: false,
        target_model_installed: false,
        is_ready: false,
        active_model: 'llama3.1:latest',
        error: 'Backend is starting up or offline'
      });
    }
  };

  useEffect(() => {
    loadAiStatus();
    const statusTimer = window.setInterval(loadAiStatus, 15000);
    return () => window.clearInterval(statusTimer);
  }, []);

  const handleStartChatWithPrompt = (promptText) => {
    setChatInitialPrompt(promptText);
    setCurrentPage('chat');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        theme={theme}
        toggleTheme={toggleTheme}
        aiStatus={aiStatus}
      />

      {/* Mandatory Statutory Disclaimer Banner */}
      <DisclaimerBanner currentLang={currentLang} />

      {/* Main Page Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={setCurrentPage}
            currentLang={currentLang}
            onStartChatWithPrompt={handleStartChatWithPrompt}
          />
        )}
        {currentPage === 'chat' && (
          <ChatPage
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
            initialPrompt={chatInitialPrompt}
            onClearInitialPrompt={() => setChatInitialPrompt(null)}
          />
        )}
        {currentPage === 'knowledge' && (
          <KnowledgePage
            currentLang={currentLang}
            onAskAboutTopic={handleStartChatWithPrompt}
          />
        )}
        {currentPage === 'document' && (
          <DocumentPage currentLang={currentLang} />
        )}
        {currentPage === 'about' && (
          <AboutPage />
        )}
        {currentPage === 'settings' && (
          <SettingsPage
            currentLang={currentLang}
            setCurrentLang={setCurrentLang}
            theme={theme}
            toggleTheme={toggleTheme}
            aiStatus={aiStatus}
            onRefreshAiStatus={loadAiStatus}
          />
        )}
      </main>

      {/* Clean Professional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center text-white">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white">LegalSaathi AI</span>
            <span>• Multilingual Legal Rights Awareness Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-300">
              <PhoneCall className="w-3 h-3 text-red-400" />
              <span>National Emergency: <strong>112</strong></span>
            </span>
            <span className="flex items-center space-x-1 text-slate-300">
              <ShieldAlert className="w-3 h-3 text-teal-400" />
              <span>Free Legal Aid (NALSA): <strong>15100</strong></span>
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            Final-Year Engineering Major Project Demonstration
          </div>
        </div>
      </footer>
    </div>
  );
}
