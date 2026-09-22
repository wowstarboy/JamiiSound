import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Mail, Heart, CheckCircle2, Lock, Sparkles, UserCheck } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  // Ensure we always start scrolled to top when opened
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl mx-auto space-y-8 pb-20">
        
        {/* Sticky / Top Navigation Bar */}
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
              <ShieldCheck className="w-5 h-5 text-white" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Privacy Policy
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              JamiiSound User Privacy, Trust & Data Protection Commitment
            </p>
          </div>
        </div>

        {/* Welcome & Core Philosophy */}
        <section className="bg-neutral-950/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Heart className="w-4 h-4 text-white" />
            <span>Built on Trust, Empowerment & Mutual Respect</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Welcome to JamiiSound. We believe music is a universal cultural bridge, and every listener and artist deserves an inspiring, respectful, and safe digital home. Your personal information belongs to you. This Privacy Policy outlines our transparent, user-first approach to keeping your account secure and delivering the best sound experience possible.
          </p>
        </section>

        {/* 1. What We Collect */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-mono">1</span>
            Information That Powers Your Experience
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            We only collect the essential information required to give you an uninterrupted, high-fidelity music experience:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-neutral-300" />
                Account & Identity
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Your chosen display name, avatar, and email address used for fast sign-in and personalized account settings.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neutral-300" />
                Musical Taste & Library
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Your favorite songs, saved playlists, play queues, and sound equalizer preferences so you can pick up exactly where you left off.
              </p>
            </div>
          </div>
        </section>

        {/* 2. How We Use It to Elevate Your Listening */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-mono">2</span>
            How We Use Your Data
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Everything we do with your data is designed to elevate your personal music journey:
          </p>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Seamless Playback:</strong> Syncing your playlists, queues, and listening history smoothly across your devices.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Tailored Discovery:</strong> Recommending trending tracks, emerging African and international artists, and curated charts aligned with your taste.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Audio Perfection:</strong> Saving your personalized 3-band equalizer profiles and lyrics synchronization preferences.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Account Protection:</strong> Providing instant security alerts, password resets, and reliable account recovery.</span>
            </li>
          </ul>
        </section>

        {/* 3. Absolute Respect for Your Privacy */}
        <section className="space-y-3 bg-neutral-900/40 border border-white/10 rounded-2xl p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-white" />
            Zero Data Selling & Full Privacy Respect
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            We value your trust above all else:
          </p>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-white font-bold">•</span>
              <span><strong>We never sell your data:</strong> JamiiSound does not sell, rent, or trade your personal information or listening habits to third-party data brokers or marketing networks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white font-bold">•</span>
              <span><strong>Industry-Standard Security:</strong> We utilize modern cloud encryption, secure HTTPS streaming protocols, and role-based access to safeguard your account.</span>
            </li>
          </ul>
        </section>

        {/* 4. Your Rights & Total Control */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-mono">3</span>
            You Are in Complete Control
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            You hold complete ownership of your JamiiSound experience. At any time, you have the right to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-neutral-300 pl-2">
            <li>Update or modify your profile name, email, and password.</li>
            <li>Create, modify, or delete any of your playlists and saved favorites.</li>
            <li>Request a copy of your account data or request permanent deletion of your profile and listening records.</li>
          </ul>
        </section>

        {/* 5. Contact JamiiSound */}
        <section className="pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Mail className="w-4 h-4 text-white" />
            <span>Questions or Privacy Inquiries?</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">
            Our team is always here to listen, support, and help you with any privacy questions or data requests:
          </p>
          <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white inline-block">
            contact@jamiisound.com
          </div>
        </section>

      </div>
    </div>
  );
};
