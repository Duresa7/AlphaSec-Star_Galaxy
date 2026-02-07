import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, signUp, isLoading, authError, clearAuthError } = useAuthStore();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (mode === 'signup' && password.length < 6) return false;
    return true;
  }, [email, password, mode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearAuthError();

    if (mode === 'signin') {
      await signIn(email.trim(), password);
      return;
    }

    await signUp(email.trim(), password, displayName.trim());
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black px-4">
      <div className="holo-panel w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-lg tracking-[0.2em] uppercase"
            style={{ fontFamily: 'Orbitron, monospace', color: 'var(--holo-amber)' }}
          >
            Command Access
          </h1>
          <span className="holo-badge bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Secure
          </span>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--holo-text-muted)' }}>
          Sign in with your account to access the shared galaxy map.
        </p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            className="holo-button flex-1"
            style={{
              padding: '8px 10px',
              opacity: mode === 'signin' ? 1 : 0.5,
            }}
            onClick={() => {
              clearAuthError();
              setMode('signin');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="holo-button flex-1"
            style={{
              padding: '8px 10px',
              opacity: mode === 'signup' ? 1 : 0.5,
            }}
            onClick={() => {
              clearAuthError();
              setMode('signup');
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="holo-label mb-1 block">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="holo-input w-full px-3 py-2"
                placeholder="Optional"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="holo-label mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="holo-input w-full px-3 py-2"
              placeholder="name@domain.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="holo-label mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="holo-input w-full px-3 py-2"
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 6 : 1}
              required
            />
          </div>

          {authError && (
            <div className="text-xs border px-3 py-2" style={{ borderColor: 'rgba(220,20,60,0.35)', color: '#fca5a5' }}>
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="holo-button w-full disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
