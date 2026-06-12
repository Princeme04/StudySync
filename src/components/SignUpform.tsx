import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react';

type AuthMode = 'register' | 'login' | 'reset';

interface SignUpformProps {
  onSignUpComplete: (data: { fullName: string; email: string; password: string }) => void;
  onLoginComplete?: (data: { email: string; password: string }) => void;
  onPasswordResetRequest?: (email: string) => Promise<{ message: string; resetToken?: string }>;
  onPasswordResetConfirm?: (token: string, password: string) => Promise<void>;
  onBack: () => void;
  onNavigateHome: () => void;
  initialMode?: AuthMode;
  initialResetToken?: string;
}

export default function SignUpform({
  onSignUpComplete,
  onLoginComplete,
  onPasswordResetRequest,
  onPasswordResetConfirm,
  onBack,
  onNavigateHome,
  initialMode = 'register',
  initialResetToken = ''
}: SignUpformProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState(initialResetToken);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorObj, setErrorObj] = useState('');

  const title = mode === 'register' ? 'Create Account' : mode === 'login' ? 'Log In' : 'Reset Password';
  const description = mode === 'register'
    ? 'Create your StudySync account with email.'
    : mode === 'login'
      ? 'Continue your StudySync workflow.'
      : resetToken ? 'Choose a new password for your account.' : 'Request a password reset link.';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorObj('');
    setMessage('');
    if (mode === 'register' && !fullName.trim()) {
      setErrorObj('Please enter your full name');
      return;
    }
    if ((mode !== 'reset' || !resetToken) && (!email.trim() || !email.includes('@'))) {
      setErrorObj('Please enter a valid email');
      return;
    }
    if (mode === 'reset' && !resetToken) {
      void onPasswordResetRequest?.(email)
        .then((result) => {
          setMessage(result.message);
          if (result.resetToken) setResetToken(result.resetToken);
        })
        .catch((error) => setErrorObj(error instanceof Error ? error.message : 'Password reset failed.'));
      return;
    }
    if (password.length < 8) {
      setErrorObj(mode === 'reset' ? 'New password must be at least 8 characters' : 'Password must be at least 8 characters');
      return;
    }
    if (mode === 'reset') {
      void onPasswordResetConfirm?.(resetToken, password)
        .then(() => {
          setMessage('Password reset. You can now log in.');
          setMode('login');
          setPassword('');
          setResetToken('');
        })
        .catch((error) => setErrorObj(error instanceof Error ? error.message : 'Password reset failed.'));
      return;
    }
    if (mode === 'login') onLoginComplete?.({ email, password });
    else onSignUpComplete({ fullName, email, password });
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorObj('');
    setMessage('');
    setPassword('');
    setResetToken('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#111c2d]/45 px-4 py-8 backdrop-blur-sm"
      onClick={onBack}
    >
      <div
        className="relative my-auto flex max-h-[calc(100vh-4rem)] w-full max-w-[420px] flex-col overflow-y-auto rounded-[2rem] border border-white/80 bg-white p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onBack}
          aria-label="Close authentication panel"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-surface-low text-brand-on-surface-variant transition-colors hover:bg-brand-surface-container hover:text-brand-primary cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-8 flex flex-col items-center justify-center">
          <button type="button" className="mb-1 flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
            <BookOpen className="h-6 w-6 text-brand-primary" fill="currentColor" />
            <span className="text-xl font-extrabold tracking-tight text-brand-primary">StudySync</span>
          </button>
          <h2 id="signup-title" className="mt-4 text-2xl font-bold text-brand-on-surface">{title}</h2>
          <p className="mt-1 text-center text-sm text-brand-on-surface-variant">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorObj && <div className="rounded-lg border border-brand-error-container/30 bg-brand-error-container/20 p-2.5 text-xs font-medium text-brand-error">{errorObj}</div>}
          {message && <div className="rounded-lg border border-brand-outline-variant bg-brand-surface-low p-2.5 text-xs font-semibold text-brand-on-surface-variant">{message}</div>}

          {mode === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wide text-[#434655]">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-4 w-4 text-brand-outline" />
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jane Doe" className="w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest py-3 pl-11 pr-4 text-sm text-brand-on-surface focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold tracking-wide text-[#434655]">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-brand-outline" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@example.edu" className="w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest py-3 pl-11 pr-4 text-sm text-brand-on-surface focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
            </div>
          </div>

          {mode === 'reset' && resetToken && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wide text-[#434655]">Reset Token</label>
              <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} className="w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest px-4 py-3 text-sm text-brand-on-surface focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
              <span className="text-[10px] text-brand-outline">This token was delivered through the configured password-reset channel.</span>
            </div>
          )}

          {(mode !== 'reset' || resetToken) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold tracking-wide text-[#434655]">{mode === 'reset' ? 'New Password' : 'Password'}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-brand-outline" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-xl border border-brand-outline-variant bg-brand-surface-lowest py-3 pl-11 pr-12 text-sm text-brand-on-surface focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-md text-brand-outline transition-colors hover:bg-brand-surface-low hover:text-brand-primary cursor-pointer">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-[10px] leading-tight text-brand-outline">Must be at least 8 characters long.</span>
            </div>
          )}

          <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-container cursor-pointer">
            <span>{mode === 'register' ? 'Create Account' : mode === 'login' ? 'Log In' : resetToken ? 'Set New Password' : 'Request Reset'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-brand-outline">
            {mode === 'register' ? 'Already have an account?' : mode === 'login' ? 'Need a new account?' : 'Remembered your password?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'register' ? 'login' : mode === 'login' ? 'register' : 'login')} className="font-bold text-brand-primary hover:underline">
              {mode === 'register' ? 'Log in' : mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
          {mode === 'login' && (
            <button type="button" onClick={() => switchMode('reset')} className="mt-3 text-xs font-bold text-brand-primary hover:underline">
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
