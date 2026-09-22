import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface CreateEmailViewProps {
  initialEmail?: string;
  onBack: () => void;
  onNext: (email: string) => void;
}

export const CreateEmailView: React.FC<CreateEmailViewProps> = ({
  initialEmail = '',
  onBack,
  onNext,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    onNext(cleanEmail);
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center min-h-full text-white">
      {/* Header */}
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
        <h1 className="text-2xl font-bold tracking-tight text-white">What's your email?</h1>
        <p className="text-sm text-neutral-400">
          You'll need to confirm this email later.
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
            placeholder="Enter your email"
            className="w-full bg-neutral-800 text-white placeholder:text-neutral-500 rounded-full px-5 py-3.5 text-sm outline-none"
            autoFocus
          />
          {error && <p className="text-xs text-rose-500 mt-2 px-3">{error}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-full hover:bg-neutral-200 active:scale-[0.99] transition-all"
        >
          Next
        </button>
      </form>
    </div>
  );
};
