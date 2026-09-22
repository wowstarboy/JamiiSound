import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

interface RoleVerificationNoticeViewProps {
  role: string;
  onBack: () => void;
}

export const RoleVerificationNoticeView: React.FC<RoleVerificationNoticeViewProps> = ({ role, onBack }) => {
  const mailtoLink = `mailto:contact@jamiisound.com?subject=Verification%20Request%20for%20${encodeURIComponent(role)}&body=Hello%20JamiiSound%20Support,%0A%0AI%20would%20like%20to%20request%20early%20verification%20for%20a%20${encodeURIComponent(role)}%20account.`;

  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center min-h-full text-white">
      <div className="flex items-center mb-8">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Verification Required</h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          The <span className="text-white font-medium">{role}</span> account type currently requires verification and is not publicly available yet. Please contact support if you need immediate assistance or wish to apply for early access.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href={mailtoLink}
          className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-full flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.99] transition-all text-center"
        >
          <Mail className="w-4 h-4 text-black" />
          <span>Contact Support</span>
        </a>

        <p className="text-xs text-center text-neutral-500">
          contact@jamiisound.com
        </p>
      </div>
    </div>
  );
};
