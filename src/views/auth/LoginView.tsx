import React, { useState } from 'react';
import { Eye, EyeOff, Mail, X } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

interface LoginViewProps {
  onForgotPassword: () => void;
  onContinueWithEmail: () => void;
  onSuccess: () => void;
  onClose?: () => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onForgotPassword,
  onContinueWithEmail,
  onSuccess,
  onClose,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your email or username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let loginEmail = cleanId;

      // If user provided a username without @, find associated email in Firestore
      if (!cleanId.includes('@')) {
        try {
          const q = query(collection(db, 'users'), where('displayName', '==', cleanId));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();
            if (userData.email) {
              loginEmail = userData.email;
            }
          }
        } catch (queryErr) {
          console.error('Error looking up username:', queryErr);
        }
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Incorrect email/username or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure user document exists in Firestore
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            role: 'listener',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (dbErr) {
        console.error('Error syncing Google user to Firestore:', dbErr);
      }

      onSuccess();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6 py-8 flex flex-col justify-center min-h-full text-white relative">
      {/* Top-Right Close Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Header */}
      <div className="space-y-2 mb-8 pt-4">
        <h1 className="text-3xl font-black tracking-tight text-white">Log in to JamiiSound</h1>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email or username input - rounded corner, no border, no ornaments */}
        <div>
          <input
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Email or username"
            className="w-full bg-neutral-800 text-white placeholder:text-neutral-500 rounded-full px-5 py-3.5 text-sm outline-none"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>

        {/* Password input - rounded corner, no border, with show/hide */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Password"
            className="w-full bg-neutral-800 text-white placeholder:text-neutral-500 rounded-full px-5 py-3.5 pr-12 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Forgot password button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs font-semibold text-neutral-400 hover:text-white hover:underline transition-colors"
          >
            Forgot your password?
          </button>
        </div>

        {error && <p className="text-xs text-rose-500 px-3">{error}</p>}

        {/* Login Button with rounded corners and white background */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-full hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </div>

        {/* Action Buttons Below Login */}
        <div className="pt-4 space-y-3">
          {/* Continue with Google button with real multi-color Google icon */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white font-semibold text-sm py-3.5 rounded-full flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Continue with email button with outline email icon */}
          <button
            type="button"
            onClick={onContinueWithEmail}
            className="w-full bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white font-semibold text-sm py-3.5 rounded-full flex items-center justify-center gap-3 transition-all"
          >
            <Mail className="w-5 h-5 text-white shrink-0" strokeWidth={1.75} />
            <span>Continue with email</span>
          </button>
        </div>

        {/* Bottom Agreement & Terms / Privacy Policy Buttons */}
        <div className="pt-6 text-center">
          <p className="text-[11px] text-neutral-400 leading-relaxed max-w-sm mx-auto">
            By proceeding or signing in, you agree to our{' '}
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-white font-medium underline underline-offset-2 hover:text-neutral-300 transition-colors"
            >
              Terms of Service
            </button>{' '}
            and acknowledge that you have read our{' '}
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-white font-medium underline underline-offset-2 hover:text-neutral-300 transition-colors"
            >
              Privacy Policy
            </button>.
          </p>
        </div>
      </form>
    </div>
  );
};
