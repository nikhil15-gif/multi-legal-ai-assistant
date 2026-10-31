import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { TRANSLATIONS } from '../services/i18n';

export default function DisclaimerBanner({ currentLang }) {
  const [expanded, setExpanded] = useState(false);
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-start sm:items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold">{t.disclaimerTitle}: </span>
            <span>{t.disclaimerText}</span>
            {expanded && (
              <div className="mt-2 text-amber-800 dark:text-amber-300 leading-relaxed border-t border-amber-200 dark:border-amber-800/60 pt-2 space-y-1">
                <p>• <strong>Statutory Scope:</strong> Indian criminal law answers reflect the Bharatiya Nyaya Sanhita (BNS) 2023 and BNSS 2023 (effective July 1, 2024), distinguishing prior offences under IPC/CrPC.</p>
                <p>• <strong>Emergency Situations:</strong> If you face immediate physical danger or domestic violence, call <strong>112</strong> immediately.</p>
                <p>• <strong>Free Legal Aid:</strong> Under Section 12 of the Legal Services Authorities Act, eligible citizens receive free representation via <strong>NALSA (15100)</strong>.</p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-3 text-amber-700 dark:text-amber-400 hover:text-amber-900 flex items-center space-x-0.5 font-medium whitespace-nowrap focus:outline-none"
        >
          <span>{expanded ? 'Less' : 'Details'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
