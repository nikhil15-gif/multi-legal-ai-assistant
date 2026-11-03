import React from 'react';
import { 
  GraduationCap, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Workflow, 
  Binary,
  Code2,
  ExternalLink
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      {/* Title & Academic Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 text-xs font-semibold mb-2">
          <GraduationCap className="w-4 h-4" />
          <span>FINAL-YEAR ENGINEERING MAJOR PROJECT</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Multilingual Legal Rights Awareness AI Assistant
        </h1>
        <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mt-1">
          Application: LegalSaathi AI • Supporting English, Hindi, and Kannada
        </p>
      </div>

      {/* Abstract */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-teal-600" />
          <span>Project Abstract</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          In India, access to justice is severely hindered by legal complexity, judicial jargon, and language barriers. 
          While millions of citizens require immediate guidance regarding consumer disputes, land demarcation (Haddubastu), 
          unpaid salaries, domestic violence, or cyber frauds, conventional legal resources are largely presented in dense legalistic English.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong>LegalSaathi AI</strong> addresses this gap by engineering a complete, privacy-preserving, local Retrieval-Augmented Generation (RAG) 
          framework powered by <strong>Ollama (llama3.1)</strong> and FastAPI. It integrates verified Indian legal knowledge bases (incorporating 
          the 2024 transition to the <em>Bharatiya Nyaya Sanhita</em> and <em>BNSS</em>), cross-lingual heuristic query mapping for Hindi and Kannada, 
          and multi-format document text extraction and OCR (PDF/images) with prompt-injection defenses.
        </p>
      </section>

      {/* System Architecture & Data Flow */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Workflow className="w-5 h-5 text-teal-600" />
          <span>System Architecture & Pipeline</span>
        </h2>

        {/* Text Representation of Architecture */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
          <div className="text-teal-400 font-bold mb-2">// END-TO-END RAG DATA FLOW</div>
          <div>[User Query in EN / HI / KN]</div>
          <div className="text-slate-500 pl-4">│  ▼ (Unicode Block Detection: Devanagari / Kannada / Latin)</div>
          <div>[Language Identification & Heuristic Term Expansion]</div>
          <div className="text-slate-500 pl-4">│  ▼ (Query Token Alignment + Concept Dictionary)</div>
          <div>[TF-IDF & Cosine Similarity Retrieval over India Code Records]</div>
          <div className="text-slate-500 pl-4">│  ▼ (Confidence Scoring & Source Citation Verification)</div>
          <div>[Grounded Prompt Construction with Guardrails & BNS/BNSS 2024 Rule]</div>
          <div className="text-slate-500 pl-4">│  ▼ (Local Ollama: llama3.1:latest @ localhost:11434)</div>
          <div>[AI Citizen Rights Synthesis in Selected Language]</div>
          <div className="text-slate-500 pl-4">│  ▼ (Safety Filter + Official Helpline Emergency Interceptor)</div>
          <div>[LegalSaathi React UI with Citations, Portal Links & Follow-ups]</div>
        </div>

        {/* Document processing pipeline */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Document Assistant Processing Pipeline</span>
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Upload Validation:</strong> Validates file mime-type and enforces 10MB limit. <br />
            <strong>Text Extraction:</strong> PyMuPDF extracts text streams from digital PDFs. Tesseract OCR processes scanned images and non-searchable pages. <br />
            <strong>Security Sanitization:</strong> Strips system-prompt overrides and jailbreak commands. <br />
            <strong>Information Extraction:</strong> Categorizes agreement nature, parties, obligations, and liability caveats.
          </p>
        </div>
      </section>

      {/* Technology Stack Grid */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-teal-600" />
          <span>Technology Stack</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white">Frontend Architecture</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1">React 18, Vite, Tailwind CSS, MediaRecorder, local Faster-Whisper voice input, and browser speech playback.</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white">Backend Server</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Python 3.10+, FastAPI, Pydantic V2, Uvicorn, REST API.</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white">Local AI & LLM Engine</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Ollama local server, Meta Llama-3.1-8B, zero paid API dependence.</p>
          </div>
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white">Retrieval & Document OCR</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Scikit-learn (TF-IDF), PyMuPDF (fitz), Pillow, pytesseract.</p>
          </div>
        </div>
      </section>

      {/* Research Gap & Academic Innovation */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <Binary className="w-5 h-5 text-teal-600" />
          <span>Research Gap & Engineering Contributions</span>
        </h2>
        <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2">
          <li className="flex items-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
            <span><strong>July 1, 2024 Legal Transition Awareness:</strong> Differentiates between historical IPC/CrPC provisions and newly enacted Bharatiya Nyaya Sanhita (BNS) and BNSS statutes based on offence commission timeline.</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
            <span><strong>Cross-Lingual Indic Alignment:</strong> Heuristic concept bridges map colloquial Kannada and Hindi queries directly into India Code statutory citations without relying solely on cloud translation.</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
            <span><strong>Grounding & Hallucination Risk Controls:</strong> Retrieved legal sources and an explicit no-match fallback help limit unsupported answers, but they cannot guarantee that every generated answer is free of errors.</span>
          </li>
          <li className="flex items-start">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0 mt-0.5" />
            <span><strong>Emergency Interception:</strong> Detects immediate domestic abuse, physical danger, or cyber banking fraud and surfaces verified 24x7 toll-free government hotlines (112, 1091, 1930, 15100).</span>
          </li>
        </ul>

        <div className="rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/70 dark:bg-teal-950/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            <h3 className="text-sm font-bold">Recent Related Research · 2026 preprint</h3>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
            Rhetorical-Role-Aware Retrieval-Augmented Generation for Legal Question Answering over Indian Supreme Court Judgments
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Sayed Ayaan Ahmed Sha, Sangeetha Sivanesan, Anand Kumar Madasamy, and Navya Binu · 7 August 2026 · arXiv:2608.06828.
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            The paper studies rhetorical-role chunking, hybrid retrieval, intent-aware filtering, and reranking over 30 Indian Supreme Court judgments. Its reported evaluation uses automated LLM metrics and is limited to that corpus. It does not validate LegalSaathi AI or its Hindi and Kannada responses; it is a related-work reference, not proof of this project’s legal accuracy.
          </p>
          <a
            href="https://arxiv.org/abs/2608.06828"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-100"
          >
            Read the paper on arXiv <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>

      {/* Limitations & Future Work */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span>Project Limitations & Scope</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          1. <strong>Informational Nature:</strong> This software is engineered strictly for legal awareness and education. It does not provide certified legal representation or client confidentiality. <br />
          2. <strong>Hardware Requirements:</strong> Local Ollama llama3.1 inference requires approximately 8GB to 16GB of system RAM (optimal on Apple Silicon M-series or modern GPUs). <br />
          3. <strong>State Law Diversity:</strong> Certain property rules (e.g., revenue land codes) vary across Indian states. The system incorporates federal acts and exemplar Karnataka Land Revenue provisions.
        </p>
      </section>
    </div>
  );
}
