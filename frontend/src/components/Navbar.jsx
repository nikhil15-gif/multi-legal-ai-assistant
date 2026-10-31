import React from 'react';
import { Scale, MessageSquare, BookOpen, FileText, Info, Settings, Globe, Moon, Sun, ShieldCheck } from 'lucide-react';
import { TRANSLATIONS } from '../services/i18n';

export default function Navbar({
  currentPage,
  setCurrentPage,
  currentLang,
  setCurrentLang,
  theme,
  toggleTheme,
  aiStatus
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const navItems = [
    { id: 'home', label: t.navHome, icon: Scale },
    { id: 'chat', label: t.navChat, icon: MessageSquare },
    { id: 'knowledge', label: t.navExplorer, icon: BookOpen },
    { id: 'document', label: t.navDocument, icon: FileText },
    { id: 'about', label: t.navAbout, icon: Info },
    { id: 'settings', label: t.navSettings, icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setCurrentPage('home')}
          >
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm group-hover:bg-teal-500 transition-colors">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">{t.appName}</span>
                <span className="text-[10px] font-medium bg-teal-900 text-teal-300 border border-teal-700/50 px-1.5 py-0.5 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t.tagline}</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600/90 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* AI Provider Status Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${aiStatus?.is_ready ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                {aiStatus?.is_ready
                  ? `Ollama: ${String(aiStatus.active_model || 'llama3.1').split(':')[0]}`
                  : aiStatus?.ollama_reachable ? 'Ollama: model not ready' : 'KB Direct Grounding'}
              </span>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative flex items-center bg-slate-800 rounded-md border border-slate-700 px-2 py-1">
              <Globe className="w-4 h-4 text-teal-400 mr-1.5" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                <option value="en" className="bg-slate-900 text-white">English</option>
                <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
                <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 overflow-x-auto text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center py-1 px-2 rounded ${
                  isActive ? 'text-teal-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
