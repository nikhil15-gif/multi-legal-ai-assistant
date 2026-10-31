import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  BookOpen, 
  ExternalLink, 
  CheckCircle, 
  FileText, 
  Tag, 
  Calendar, 
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { fetchLegalCategories, searchLegalKnowledge } from '../services/api';

export default function KnowledgePage({ currentLang, onAskAboutTopic }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      try {
        const cats = await fetchLegalCategories();
        setCategories(cats);
        const res = await searchLegalKnowledge();
        setRecords(res.results || []);
      } catch (err) {
        console.error("Failed to load knowledge base:", err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await searchLegalKnowledge(searchQuery, selectedCategory);
      setRecords(res.results || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = async (cat) => {
    const newCat = selectedCategory === cat ? '' : cat;
    setSelectedCategory(newCat);
    setLoading(true);
    try {
      const res = await searchLegalKnowledge(searchQuery, newCat);
      setRecords(res.results || []);
    } catch (err) {
      console.error("Filter error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            <span>Legal Knowledge Explorer</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Curated repository of Indian statutes, sections, and citizen rights
          </p>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by act, section, or topic..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl shadow-xs transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategorySelect('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === ''
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          All Categories ({records.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Layout: Records Grid + Detail Pane */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          <span>Querying verified legal records...</span>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">No legal records found</h3>
          <p className="text-xs text-slate-500 mt-1">Try another keyword or select a different category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Records List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            {records.map((rec) => {
              const isSelected = selectedRecord?.document_id === rec.document_id;
              return (
                <div
                  key={rec.document_id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl cursor-pointer transition shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-teal-500 ring-2 ring-teal-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900">
                          {rec.legal_category}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {rec.act_name}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {rec.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-600 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {rec.section_number}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {currentLang === 'hi' && rec.simplified_explanation_hi
                      ? rec.simplified_explanation_hi
                      : currentLang === 'kn' && rec.simplified_explanation_kn
                      ? rec.simplified_explanation_kn
                      : rec.simplified_explanation}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span>{rec.official_source_name}</span>
                    </span>
                    <span className="flex items-center text-teal-600 dark:text-teal-400 font-semibold group">
                      View details <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Record Detail Pane (Right 1 col) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              {selectedRecord ? (
                <>
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                      {selectedRecord.legal_category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {selectedRecord.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {selectedRecord.act_name} — {selectedRecord.section_number}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Simplified Citizen Explanation
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      {currentLang === 'hi' && selectedRecord.simplified_explanation_hi
                        ? selectedRecord.simplified_explanation_hi
                        : currentLang === 'kn' && selectedRecord.simplified_explanation_kn
                        ? selectedRecord.simplified_explanation_kn
                        : selectedRecord.simplified_explanation}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Statutory Source Text
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed max-h-40 overflow-y-auto">
                      "{selectedRecord.source_text}"
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Jurisdiction:</span>
                      <strong className="text-slate-700 dark:text-slate-300">{selectedRecord.jurisdiction}</strong>
                    </div>
                    {selectedRecord.effective_date && (
                      <div className="flex justify-between">
                        <span>Commenced:</span>
                        <strong className="text-slate-700 dark:text-slate-300">{selectedRecord.effective_date}</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Verification:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 capitalize">{selectedRecord.verification_status}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col space-y-2">
                    {selectedRecord.official_source_url && (
                      <a
                        href={selectedRecord.official_source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-1.5 w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition"
                      >
                        <span>Open India Code Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <button
                      onClick={() => onAskAboutTopic && onAskAboutTopic(`Can you explain my rights under ${selectedRecord.act_name} (${selectedRecord.section_number}) in simple terms?`)}
                      className="flex items-center justify-center space-x-1.5 w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ask AI About This Law</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Click on any legal record to inspect statutory provisions, verification sources, and full citations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
