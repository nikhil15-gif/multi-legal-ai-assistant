import React from 'react';
import { AlertOctagon, PhoneCall, X, ShieldAlert } from 'lucide-react';

export default function EmergencyModal({ emergencyData, onClose }) {
  if (!emergencyData || !emergencyData.is_emergency) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border-2 border-red-500 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertOctagon className="w-7 h-7 text-white animate-pulse" />
            <div>
              <h3 className="font-bold text-lg tracking-wide uppercase">{emergencyData.title || "URGENT SAFETY ALERT"}</h3>
              <p className="text-xs text-red-100">Immediate Citizen Assistance Guidance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white rounded-lg p-1 hover:bg-red-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-slate-800 dark:text-slate-100">
          <p className="text-sm font-medium leading-relaxed bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-3.5 rounded-xl text-red-800 dark:text-red-200">
            {emergencyData.guidance}
          </p>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Verified 24x7 Official Emergency Helplines (Toll-Free):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {emergencyData.helplines && Object.entries(emergencyData.helplines).map(([name, number]) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{name}</p>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{number}</span>
                  </div>
                  <a
                    href={`tel:${number.split(' ')[0]}`}
                    className="p-2 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 text-red-700 dark:text-red-300 rounded-lg flex items-center"
                    title={`Call ${number}`}
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
          >
            I Understand, Continue
          </button>
        </div>
      </div>
    </div>
  );
}
