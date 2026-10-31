import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Server, 
  Cpu, 
  RefreshCw, 
  Globe, 
  Moon, 
  Sun, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Terminal,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { fetchAiStatus, fetchHealth } from '../services/api';

export default function SettingsPage({
  currentLang,
  setCurrentLang,
  theme,
  toggleTheme,
  aiStatus,
  onRefreshAiStatus
}) {
  const [checking, setChecking] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setChecking(true);
    setTestResult(null);
    try {
      const health = await fetchHealth();
      const ai = await fetchAiStatus();
      setTestResult({
        success: true,
        message: `Backend healthy (${health.knowledge_base_records} legal records indexed). Ollama status: ${ai.ollama_reachable ? 'Connected (' + ai.active_model + ')' : 'Offline (Direct KB fallback active)'}`
      });
      if (onRefreshAiStatus) onRefreshAiStatus();
    } catch (err) {
      setTestResult({
        success: false,
        message: `Failed to connect to backend: ${err.message}`
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-teal-600" />
          <span>System Settings & Diagnostics</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure model parameters, language preferences, and inspect local Ollama connectivity
        </p>
      </div>

      {/* Language & Theme Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Globe className="w-4 h-4 text-teal-600" />
          <span>Language & Interface Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Active Consultation Language
            </label>
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="en">English (Official & Statutory)</option>
              <option value="hi">हिन्दी — Hindi (Devanagari)</option>
              <option value="kn">ಕನ್ನಡ — Kannada (ಕನ್ನಡ ಲಿಪಿ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Appearance Theme
            </label>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-slate-200"
            >
              <span className="capitalize">{theme} Mode</span>
              {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        </div>
      </div>

      {/* AI Provider & Ollama Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-teal-600" />
            <span>AI Inference Provider Status</span>
          </h3>
          <button
            onClick={handleTestConnection}
            disabled={checking}
            className="flex items-center space-x-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Test Connection'}</span>
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
            testResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}>
            {testResult.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Default Provider</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1 capitalize">
              {aiStatus?.provider || 'Ollama (Local)'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Target Model</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
              {aiStatus?.active_model || 'llama3.1:latest'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {aiStatus?.target_model_installed ? 'Installed and ready' : aiStatus?.ollama_reachable ? 'Not installed yet' : 'Waiting for Ollama'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Ollama Service</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${aiStatus?.ollama_reachable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {aiStatus?.ollama_reachable ? 'Online (Port 11434)' : 'Offline (Direct KB fallback)'}
              </p>
            </div>
          </div>
        </div>

        {/* Installed models */}
        {aiStatus?.ollama_models && aiStatus.ollama_models.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 block mb-1">Detected Ollama Models:</span>
            <div className="flex flex-wrap gap-1.5">
              {aiStatus.ollama_models.map((m) => (
                <span key={m} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Setup & Local Execution Reference Card */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-teal-400" />
          <span>Local Startup Guide (Windows & Mac)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Windows Instructions */}
          <div className="space-y-2 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-teal-400 font-bold block mb-1">💻 Windows (PowerShell / CMD)</span>
            <p className="text-slate-400">// Quick: Double-click run_windows.bat</p>
            <p className="text-slate-400 pt-1">// Terminal 1 (Backend):</p>
            <div className="text-teal-300 bg-slate-900 p-2 rounded">
              cd backend<br />
              python -m venv venv<br />
              .\venv\Scripts\activate<br />
              pip install -r requirements.txt<br />
              python app/main.py
            </div>
            <p className="text-slate-400 pt-1">// Terminal 2 (Frontend):</p>
            <div className="text-teal-300 bg-slate-900 p-2 rounded">
              cd frontend<br />
              npm install<br />
              npm run dev
            </div>
          </div>

          {/* Mac Instructions */}
          <div className="space-y-2 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-teal-400 font-bold block mb-1">🍎 macOS (Terminal)</span>
            <p className="text-slate-400">// Quick: ./run_mac.sh</p>
            <p className="text-slate-400 pt-1">// Terminal 1 (Backend):</p>
            <div className="text-teal-300 bg-slate-900 p-2 rounded">
              cd backend<br />
              python3 -m venv venv<br />
              source venv/bin/activate<br />
              pip install -r requirements.txt<br />
              python3 app/main.py
            </div>
            <p className="text-slate-400 pt-1">// Terminal 2 (Frontend):</p>
            <div className="text-teal-300 bg-slate-900 p-2 rounded">
              cd frontend<br />
              npm install<br />
              npm run dev
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
