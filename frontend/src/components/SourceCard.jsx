import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, ChevronDown, ChevronUp, FileBadge2 } from 'lucide-react';

export default function SourceCard({ citation }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 shadow-sm hover:border-teal-500/50 transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <FileBadge2 className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            {citation.act_name}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {citation.section_number}
          </span>
        </div>
        
        <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {citation.verification_status === 'verified' ? 'Verified Official' : 'Curated'}
        </span>
      </div>

      <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2">
        {citation.provision_title}
      </h5>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <p className="italic bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
            "{citation.relevant_text}"
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Source: {citation.official_source_name}</span>
            {citation.score && <span>Relevance: {(citation.score * 100).toFixed(1)}%</span>}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center space-x-1 font-medium"
        >
          <span>{expanded ? 'Hide Excerpt' : 'View Statutory Text'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {citation.official_source_url && (
          <a
            href={citation.official_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
