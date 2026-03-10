import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Mode = 'login' | 'signup';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'A digit' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export { PASSWORD_RULES };

export function useAuthForm(onSuccess: () => void) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [galaxyMapRequested, setGalaxyMapRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = useCallback((options?: { keepSuccessMessage?: boolean }) => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setGalaxyMapRequested(false);
    setError(null);
    if (!options?.keepSuccessMessage) {
      setSuccessMessage(null);
    }
  }, []);

  const switchMode = useCallback((newMode: Mode, options?: { keepSuccessMessage?: boolean }) => {
    setMode(newMode);
    resetForm(options);
  }, [resetForm]);

  const passwordStrength = mode === 'signup'
    ? PASSWORD_RULES.filter((r) => r.test(password)).length
    : 0;

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
        onSuccess();
      } else {
        const { error: err } = await signUp(email, password, displayName.trim(), galaxyMapRequested);
        if (err) { setError(err); return; }
        setSuccessMessage('Account created! Check your email to confirm, then sign in. If you don\'t see it, check your spam folder.');
        switchMode('login', { keepSuccessMessage: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    displayName,
    setDisplayName,
    galaxyMapRequested,
    setGalaxyMapRequested,
    error,
    submitting,
    successMessage,
    passwordStrength,
    switchMode,
    handleSubmit,
  };
}
