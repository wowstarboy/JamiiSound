import React, { useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Mail } from 'lucide-react';

interface ReportViewProps {
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ onBack }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-neutral-900 border border-white/10 text-white hover:bg-neutral-800 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Report
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Copyright, Abuse & Content Reports
            </p>
          </div>
        </div>

        <section className="bg-neutral-950/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Reporting Procedure
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            If you encounter infringing content, unauthorized audio uploads, intellectual property violations, or technical defects on JamiiSound, send notice directly to our legal and safety review team.
          </p>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Include the song title, artist name, track URL, and a description of your claim or issue.
          </p>
        </section>

        <section className="bg-neutral-950/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Direct Report Email
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Send all reports directly to:
          </p>
          <div className="flex items-center gap-2 pt-1 text-sm font-mono text-white">
            <Mail className="w-4 h-4 text-neutral-400" />
            <a href="mailto:contact@jamiisound.com" className="hover:underline">
              contact@jamiisound.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
