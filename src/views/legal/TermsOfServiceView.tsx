import React, { useEffect } from 'react';
import { ArrowLeft, FileText, Mail, Sparkles, CheckCircle2, Music, Users, Shield } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  // Ensure we always start scrolled to top when opened
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl mx-auto space-y-8 pb-20">
        
        {/* Top Navigation Bar */}
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
              <FileText className="w-5 h-5 text-white" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Terms of Service
              </h1>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              JamiiSound Platform Agreement & Community Guidelines
            </p>
          </div>
        </div>

        {/* Welcome & Community Spirit */}
        <section className="bg-neutral-950/80 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Sparkles className="w-4 h-4 text-white" />
            <span>Connecting Creators & Music Lovers Globally</span>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Welcome to JamiiSound. Our platform is designed to unite music enthusiasts, emerging talents, and cultural pioneers in a positive, inspiring environment. By signing up and enjoying JamiiSound, you become part of a growing community dedicated to celebrating musical creativity and fair expression.
          </p>
        </section>

        {/* 1. What JamiiSound Offers */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-mono">1</span>
            Our Service & Mission
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            JamiiSound gives you access to a rich catalog of songs, curated playlists, high-fidelity audio controls, synchronized lyrics, and personalized music exploration across both mobile and desktop devices.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Music className="w-4 h-4 text-neutral-300" />
                Empowering Artists
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Giving voice to authentic sounds, supporting African culture and global rhythms with seamless reach.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 space-y-1.5">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-neutral-300" />
                Vibrant Listener Community
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Enjoy personalized recommendations, community playlists, and interactive audio visualizers without clutter.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Community Respect & Creator Rights */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-mono">2</span>
            Respecting Creators & Intellectual Property
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Music is art, heart, and dedication. We deeply honor copyright owners, artists, and producers:
          </p>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Personal Streaming License:</strong> As a user, you are granted a personal, non-commercial right to stream and enjoy all available tracks on JamiiSound.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Creator Ownership:</strong> Songs, artwork, and lyrics remain the intellectual property of their respective creators and distributors.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span><strong>Fair Community Conduct:</strong> We ask all community members to enjoy music responsibly and avoid unauthorized commercial resale or automated mass extraction.</span>
            </li>
          </ul>
        </section>

        {/* 3. Account Responsibilities */}
        <section className="space-y-3 bg-neutral-900/40 border border-white/10 rounded-2xl p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            Your Account & Safe Enjoyment
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            Creating an account unlocks custom playlists, favorites, and synchronized listening. We ask you to:
          </p>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-white font-bold">•</span>
              <span>Provide accurate registration information and keep your login password secure.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white font-bold">•</span>
              <span>Engage respectfully with other community members, creators, and platform features.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-white font-bold">•</span>
              <span>Feel free to update your preferences or close your account at any time with full dignity and ease.</span>
            </li>
          </ul>
        </section>

        {/* 4. Continuous Growth & Improvement */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center font-mono">3</span>
            Service Evolution & High Availability
          </h2>
          <p className="text-sm text-neutral-300 leading-relaxed">
            JamiiSound constantly updates its streaming infrastructure, adding studio-quality equalizer features, expansive chart data, and new tracks to elevate your listening. We strive for 24/7 reliability and smooth streaming performance across all modern web browsers and mobile environments.
          </p>
        </section>

        {/* 5. Contact & Artist Partnerships */}
        <section className="pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Mail className="w-4 h-4 text-white" />
            <span>Connect with JamiiSound Legal & Community Team</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">
            Whether you are a listener with feedback, an artist looking to showcase your music, or have questions about these terms:
          </p>
          <div className="p-3 bg-neutral-900 border border-white/10 rounded-xl text-xs font-mono text-white inline-block">
            contact@jamiisound.com
          </div>
        </section>

      </div>
    </div>
  );
};
