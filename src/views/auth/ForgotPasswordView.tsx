import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface ForgotPasswordViewProps {
  onBack: () => void;
  onDone?: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onBack, onDone }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email.trim());
      setShowSuccessPopup(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center min-h-full text-white relative">
      {/* Top Header */}
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

      <div className="space-y-2 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
        <p className="text-sm text-neutral-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Email address"
            className="w-full bg-neutral-800 text-white placeholder:text-neutral-500 rounded-full px-5 py-3.5 text-sm outline-none"
            autoFocus
          />
          {error && <p className="text-xs text-rose-500 mt-2 px-3">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-full hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {loading ? 'Sending link...' : 'Send Link'}
        </button>
      </form>

      {/* Success Popup with large rounded corners and large filled email icon */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 text-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Big Filled Email Icon */}
            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-white shrink-0">
              <svg className="w-10 h-10 fill-current" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Check your email</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                We have sent a password reset link to <span className="text-white font-medium">{email}</span>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSuccessPopup(false);
                if (onDone) onDone();
                else onBack();
              }}
              className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-full hover:bg-neutral-200 transition-colors"
            >
              Back to Log in
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
