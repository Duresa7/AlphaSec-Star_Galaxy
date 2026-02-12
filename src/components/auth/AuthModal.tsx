import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'signup';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'A digit' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError(null);
    setSuccessMessage(null);
  }, []);

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    resetForm();
  }, [resetForm]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (mode === 'signup') {
      const failedRules = PASSWORD_RULES.filter((r) => !r.test(password));
      if (failedRules.length > 0) {
        setError(`Password requires: ${failedRules.map((r) => r.label).join(', ')}`);
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!displayName.trim()) {
        setError('Display name is required');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password);
        if (err) { setError(err); return; }
        onClose();
      } else {
        const { error: err } = await signUp(email, password, displayName.trim());
        if (err) { setError(err); return; }
        setSuccessMessage('Account created! Check your email to confirm, then sign in. If you don\'t see it, check your spam folder.');
        switchMode('login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const passwordStrength = mode === 'signup'
    ? PASSWORD_RULES.filter((r) => r.test(password)).length
    : 0;

  return (
    <div className="auth-modal__backdrop" onClick={onClose}>
      <div className="auth-modal__card" onClick={(e) => e.stopPropagation()}>

        <button className="auth-modal__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>


        <p className="auth-modal__eyebrow">Galaxy Map</p>
        <h2 className="auth-modal__title">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

        {successMessage && (
          <div className="auth-modal__success">{successMessage}</div>
        )}

        {error && (
          <div className="auth-modal__error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-modal__form">
          {mode === 'signup' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="auth-modal__input"
                placeholder="Your name"
                maxLength={40}
                required
                autoFocus
              />
            </div>
          )}

          <div className="auth-modal__field">
            <label className="auth-modal__label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-modal__input"
              placeholder="you@example.com"
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="auth-modal__field">
            <label className="auth-modal__label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-modal__input"
              placeholder={mode === 'signup' ? 'Min 8 chars, mixed case, digit, special' : 'Your password'}
              required
            />
            {mode === 'signup' && password.length > 0 && (
              <div className="auth-modal__strength">
                <div className="auth-modal__strength-bar">
                  <div
                    className="auth-modal__strength-fill"
                    style={{
                      width: `${(passwordStrength / PASSWORD_RULES.length) * 100}%`,
                      background: passwordStrength <= 2 ? '#dc3545' : passwordStrength <= 4 ? '#f0ad4e' : '#5cb85c',
                    }}
                  />
                </div>
                <span className="auth-modal__strength-label">
                  {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 4 ? 'Fair' : 'Strong'}
                </span>
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="auth-modal__input"
                placeholder="Re-enter password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="auth-modal__submit"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-modal__switch">
          {mode === 'login' ? (
            <>Don't have an account?{' '}<button onClick={() => switchMode('signup')}>Sign Up</button></>
          ) : (
            <>Already have an account?{' '}<button onClick={() => switchMode('login')}>Sign In</button></>
          )}
        </p>
      </div>
    </div>
  );
}
