import React from 'react';
import { 
  MessageSquare, 
  FileText, 
  Mic, 
  ShieldCheck, 
  ShoppingBag, 
  Home, 
  ShieldAlert, 
  UserCheck, 
  Briefcase, 
  Scale, 
  Lock, 
  FileSpreadsheet, 
  ArrowRight,
  Sparkles,
  Globe2
} from 'lucide-react';
import { TRANSLATIONS } from '../services/i18n';

export default function HomePage({ onNavigate, currentLang, onStartChatWithPrompt }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const topics = [
    {
      id: 'consumer',
      title: 'Consumer Rights',
      icon: ShoppingBag,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
      desc: 'Defective products, replacement rights, warranty denial, unfair trade practices, and consumer forum filings.',
      samplePrompt: 'What can I do if a shopkeeper sells me a defective product and refuses to refund my money?'
    },
    {
      id: 'property',
      title: 'Land & Property Disputes',
      icon: Home,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
      desc: 'Boundary demarcation, illegal encroachment, Tahsildar survey (Haddubastu), tenant eviction rights.',
      samplePrompt: 'ಭೂಮಿಯ ಗಡಿ ವಿವಾದವಾದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?'
    },
    {
      id: 'criminal',
      title: 'Criminal Law & FIR Procedures',
      icon: ShieldAlert,
      color: 'text-red-500 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
      desc: 'Zero FIR, Section 173 BNSS 2023, arrestee rights, D.K. Basu guidelines, police refusal remedies.',
      samplePrompt: 'What is a Zero FIR under BNSS 2023 and what rights do I have if police refuse to register my complaint?'
    },
    {
      id: 'women',
      title: "Women's Legal Protections",
      icon: UserCheck,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
      desc: 'Domestic Violence Act (PWDVA 2005), workplace sexual harassment (POSH), maintenance and shared household.',
      samplePrompt: 'घरेलू हिंसा के खिलाफ एक महिला के क्या कानूनी अधिकार हैं?'
    },
    {
      id: 'labour',
      title: 'Labour & Employment Rights',
      icon: Briefcase,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
      desc: 'Unpaid salary recovery, Code on Wages 2019, 5-year gratuity eligibility, unlawful termination.',
      samplePrompt: 'What are my legal remedies if my employer does not pay my salary for two months?'
    },
    {
      id: 'cyber',
      title: 'Cybercrime Awareness',
      icon: Lock,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-900',
      desc: 'UPI bank fraud, 1930 portal reporting, online blackmail, identity theft under IT Act 2000.',
      samplePrompt: 'How can I freeze transferred funds if I am cheated in an online banking or UPI scam?'
    },
    {
      id: 'rights',
      title: 'Fundamental Rights & Privacy',
      icon: Scale,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900',
      desc: 'Articles 14, 19, 21, Right to Privacy (Puttaswamy case), High Court and Supreme Court writ petitions.',
      samplePrompt: 'What is Article 21 of the Indian Constitution and how does it protect citizen privacy and liberty?'
    },
    {
      id: 'procedures',
      title: 'NALSA & RTI Procedures',
      icon: FileSpreadsheet,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900',
      desc: 'Free government legal aid (NALSA 15100), Right to Information (RTI Act 2005) 30-day timeline.',
      samplePrompt: 'Who is eligible for free legal representation under NALSA Section 12 in India?'
    }
  ];

  const recentQuestions = [
    { text: "What are my rights if my employer does not pay my salary?", lang: "English" },
    { text: "अगर कोई दुकानदार खराब सामान बेचता है तो मेरे क्या अधिकार हैं?", lang: "हिन्दी" },
    { text: "ಭೂಮಿಯ ಗಡಿ ವಿವಾದವಾದರೆ ನಾನು ಏನು ಮಾಡಬೇಕು?", lang: "ಕನ್ನಡ" },
    { text: "Can police arrest a woman after sunset without a magistrate order?", lang: "English" },
    { text: "ऑनलाइन वित्तीय धोखाधड़ी होने पर 1930 पर शिकायत कैसे दर्ज करें?", lang: "हिन्दी" },
  ];

  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-legal-900 text-white p-8 sm:p-12 shadow-xl border border-slate-700/60">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-POWERED CITIZEN LEGAL EMPOWERMENT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Know Your Rights.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-300 to-blue-400">
              In Simple Language.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            LegalSaathi AI translates complex Indian statutes, court precedents, and procedural codes into 
            accessible guidance in <strong>English</strong>, <strong>हिन्दी</strong>, and <strong>ಕನ್ನಡ</strong>.
            Grounded in verified official India Code records with citations.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigate('chat')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.startChatting}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={() => onNavigate('document')}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 font-semibold text-sm transition"
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>{t.uploadDoc}</span>
            </button>

            <button
              onClick={() => {
                onNavigate('chat');
              }}
              className="flex items-center space-x-2 px-4 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
              title="Speak your question"
            >
              <Mic className="w-4 h-4 text-red-400" />
              <span>Voice Query</span>
            </button>
          </div>

          {/* Multilingual Support Badges */}
          <div className="flex items-center space-x-3 pt-2 text-xs text-slate-400">
            <Globe2 className="w-4 h-4 text-teal-400" />
            <span>Supported Languages:</span>
            <span className="font-semibold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">English</span>
            <span className="font-semibold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">हिन्दी</span>
            <span className="font-semibold text-white bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">ಕನ್ನಡ</span>
          </div>
        </div>

        {/* Decorative background grid pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
      </section>

      {/* Legal Topic Cards Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.categoriesTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.categoriesSub}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map((top) => {
            const Icon = top.icon;
            return (
              <div
                key={top.id}
                onClick={() => onStartChatWithPrompt(top.samplePrompt)}
                className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-500/50 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${top.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {top.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {top.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400">
                  <span>Explore Topic</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Common Citizen Questions Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">{t.sampleQuestionsTitle}</h3>
          </div>
          <span className="text-xs text-slate-400">Click to ask instantly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recentQuestions.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onStartChatWithPrompt(item.text)}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700/80 rounded-xl cursor-pointer transition flex items-center justify-between group"
            >
              <div className="pr-3">
                <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 mr-2 bg-teal-100 dark:bg-teal-950 px-1.5 py-0.5 rounded">
                  {item.lang}
                </span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                  {item.text}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 flex-shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
