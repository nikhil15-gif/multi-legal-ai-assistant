import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  FileSearch, 
  HelpCircle, 
  Trash2, 
  Loader2, 
  FileCheck, 
  ShieldAlert, 
  Send,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { uploadDocument, askDocument, summarizeDocument, deleteDocument } from '../services/api';
import { TRANSLATIONS } from '../services/i18n';

export default function DocumentPage({ currentLang }) {
  const [file, setFile] = useState(null);
  const [docData, setDocData] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Document QA state
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaAnswer, setQaAnswer] = useState(null);

  // Summarize state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setErrorMsg(null);
    setIsUploading(true);
    setQaAnswer(null);
    setSummaryData(null);

    try {
      const res = await uploadDocument(selectedFile);
      setDocData(res);
      setFile(selectedFile);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Failed to process document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsUploading(true);
      setErrorMsg(null);
      const resp = await fetch('/sample_legal_document.txt');
      const text = await resp.text();
      const sampleBlob = new Blob([text], { type: 'text/plain' });
      const sampleFile = new File([sampleBlob], "sample_residential_lease_agreement.txt", { type: "text/plain" });
      await handleFileUpload(sampleFile);
    } catch (err) {
      setErrorMsg("Failed to load sample agreement: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim() || !docData?.doc_id || isAsking) return;

    setIsAsking(true);
    try {
      const res = await askDocument(docData.doc_id, question, currentLang);
      setQaAnswer(res);
    } catch (err) {
      setErrorMsg("Query failed: " + err.message);
    } finally {
      setIsAsking(false);
    }
  };

  const handleSummarize = async () => {
    if (!docData?.doc_id || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const res = await summarizeDocument(docData.doc_id, currentLang);
      setSummaryData(res);
    } catch (err) {
      setErrorMsg("Summarization failed: " + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDelete = async () => {
    if (docData?.doc_id) {
      await deleteDocument(docData.doc_id);
    }
    setFile(null);
    setDocData(null);
    setQaAnswer(null);
    setSummaryData(null);
    setQuestion('');
  };

  return (
    <div className="space-y-6 py-4">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <FileText className="w-6 h-6 text-teal-600" />
          <span>Legal Document Assistant</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload PDF contracts, tenancy agreements, or notice images for automated text extraction, summarization, and query answering.
        </p>
      </div>

      {/* Security & Privacy Banner */}
      <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <span>
            <strong>Local Processing & Privacy:</strong> Uploaded documents are processed in-memory for your active session only. Prompt-injection filters sanitize untrusted text before processing.
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-3.5 text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Box / Drag & Drop */}
      {!docData ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-3xl p-8 sm:p-12 text-center transition">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.txt,.png,.jpg,.jpeg"
            onChange={(e) => handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
              {isUploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              {isUploading ? "Extracting Text & Analyzing..." : t.uploadZonePrompt}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
              {t.uploadZoneLimit}
            </p>
          </label>

          {/* Quick Demo Sample Button */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center space-x-2">
            <span className="text-xs text-slate-400">Want to test right away?</span>
            <button
              onClick={handleLoadSample}
              disabled={isUploading}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Residential Lease Agreement</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Document Workspace */
        <div className="space-y-6">
          {/* Document Meta Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{docData.filename}</h3>
                  <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded">
                    {docData.file_type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pages: {docData.page_count} • Characters: {docData.extracted_length} • OCR Applied: {docData.ocr_used ? 'Yes' : 'No (Native Text)'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
              >
                {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
                <span>{t.summarizeBtn}</span>
              </button>

              <button
                onClick={handleDelete}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-slate-500 hover:text-red-500 rounded-xl transition"
                title="Remove Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Summary Section */}
          {summaryData && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-teal-600" />
                    <span>{t.docSummaryTitle}</span>
                  </h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
                    Classification: {summaryData.document_nature}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                {summaryData.summary}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Obligations */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                    {t.keyObligations}
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    {summaryData.key_obligations.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-teal-500 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risks & Cautions */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                    {t.potentialRisks}
                  </h4>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                    {summaryData.potential_risks_or_cautions.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-amber-500 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Ask Question About Document */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-teal-600" />
              <span>Ask a Specific Question About This Document</span>
            </h3>

            <form onSubmit={handleAskQuestion} className="flex items-center space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What is the termination clause or notice period required?"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={isAsking || !question.trim()}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm rounded-xl shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Inquire</span>
              </button>
            </form>

            {/* QA Answer display */}
            {qaAnswer && (
              <div className="mt-4 p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 rounded-xl space-y-3 animate-fade-in">
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {qaAnswer.answer}
                </div>

                {/* Legal terminology breakdown */}
                {qaAnswer.legal_terms_explained && qaAnswer.legal_terms_explained.length > 0 && (
                  <div className="pt-3 border-t border-teal-200 dark:border-teal-900/60">
                    <h5 className="text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider mb-2">
                      Legal Terminology Identified in Document:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qaAnswer.legal_terms_explained.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-teal-100 dark:border-slate-800 text-xs">
                          <strong className="text-slate-900 dark:text-white">{item.term}: </strong>
                          <span className="text-slate-600 dark:text-slate-400">{item.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Preview Accordion */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Extracted Document Preview
            </h4>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {docData.preview_text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
