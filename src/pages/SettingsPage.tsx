import { useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { updateDisplayName, logAction } from '@/data/supabaseStorage';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'Lowercase letter' },
  { test: (p: string) => /\d/.test(p), label: 'A digit' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export function SettingsPage() {
  const heroImageUrl = `${import.meta.env.BASE_URL}homepage-bg.jpg`;
  const navigate = useNavigate();
  const { session, updateEmail, updatePassword, deleteAccount } = useAuth();
  const { profile, refreshProfile } = useProfile();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameMsg, setDisplayNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDisplayNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setDisplayNameMsg(null);
    const trimmed = displayName.trim();
    if (!trimmed) {
      setDisplayNameMsg({ type: 'error', text: 'Display name cannot be empty.' });
      return;
    }
    if (!session?.user?.id) return;
    setDisplayNameSaving(true);
    const { error } = await updateDisplayName(session.user.id, trimmed);
    if (error) {
      setDisplayNameMsg({ type: 'error', text: error });
    } else {
      await logAction('display_name_changed', 'user', session.user.id, trimmed, {
        previous: profile?.display_name,
      });
      await refreshProfile();
      setDisplayNameMsg({ type: 'success', text: 'Display name updated.' });
    }
    setDisplayNameSaving(false);
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);
    if (!newEmail.trim()) {
      setEmailMsg({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }
    setEmailSaving(true);
    const { error } = await updateEmail(newEmail.trim());
    if (error) {
      setEmailMsg({ type: 'error', text: error });
    } else {
      if (session?.user?.id) {
        await logAction('email_changed', 'user', session.user.id, profile?.display_name ?? '', {
          newEmail: newEmail.trim(),
        });
      }
      setEmailMsg({ type: 'success', text: 'Check your new email for a confirmation link.' });
      setNewEmail('');
    }
    setEmailSaving(false);
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    const failedRules = PASSWORD_RULES.filter((r) => !r.test(newPassword));
    if (failedRules.length > 0) {
      setPasswordMsg({ type: 'error', text: `Password requires: ${failedRules.map((r) => r.label).join(', ')}` });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPasswordSaving(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      setPasswordMsg({ type: 'error', text: error });
    } else {
      if (session?.user?.id) {
        await logAction('password_changed', 'user', session.user.id, profile?.display_name ?? '');
      }
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setPasswordSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleteMsg(null);
    setDeleting(true);
    if (session?.user?.id) {
      await logAction('account_deleted', 'user', session.user.id, profile?.display_name ?? '');
    }
    const { error } = await deleteAccount();
    if (error) {
      setDeleteMsg({ type: 'error', text: error });
      setDeleting(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(newPassword)).length;

  return (
    <div
      className="settings-page"
      style={{ '--portfolio-hero-bg-image': `url("${heroImageUrl}")` } as CSSProperties}
    >
      <div className="settings-page__layer settings-page__layer--base" />
      <div className="settings-page__layer settings-page__layer--grid" />
      <div className="settings-page__layer settings-page__layer--veil" />

      <div className="settings-page__content">
        <div className="settings-page__topbar">
          <Link to="/" className="settings-page__back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
              <path d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Back to Home
          </Link>
          {profile && (
            <span className="settings-page__user-pill">
              {profile.display_name}
            </span>
          )}
        </div>

        <div className="settings-page__hero">
          <p className="settings-page__kicker">Account</p>
          <h1 className="settings-page__name">Settings</h1>
          <p className="settings-page__subtitle">Manage your account preferences</p>
        </div>

        <div className="settings-page__grid">
          <div className="settings-page__section">
            <h2 className="settings-page__section-title">Display Name</h2>
            {displayNameMsg && (
              <div className={`settings-page__msg settings-page__msg--${displayNameMsg.type}`}>
                {displayNameMsg.text}
              </div>
            )}
            <form onSubmit={handleDisplayNameSubmit} className="settings-page__form">
              <div className="settings-page__field">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="settings-page__input"
                  placeholder="Your display name"
                  maxLength={40}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={displayNameSaving}
                className="settings-page__submit"
              >
                {displayNameSaving ? 'Saving...' : 'Save Name'}
              </button>
            </form>
          </div>

          <div className="settings-page__section">
            <h2 className="settings-page__section-title">Change Email</h2>
            <p className="settings-page__hint">Current: {session?.user?.email ?? 'Unknown'}</p>
            {emailMsg && (
              <div className={`settings-page__msg settings-page__msg--${emailMsg.type}`}>
                {emailMsg.text}
              </div>
            )}
            <form onSubmit={handleEmailSubmit} className="settings-page__form">
              <div className="settings-page__field">
                <label className="settings-page__label">New Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="settings-page__input"
                  placeholder="new@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={emailSaving}
                className="settings-page__submit"
              >
                {emailSaving ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>

          <div className="settings-page__section">
            <h2 className="settings-page__section-title">Change Password</h2>
            {passwordMsg && (
              <div className={`settings-page__msg settings-page__msg--${passwordMsg.type}`}>
                {passwordMsg.text}
              </div>
            )}
            <form onSubmit={handlePasswordSubmit} className="settings-page__form">
              <div className="settings-page__field">
                <label className="settings-page__label">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="settings-page__input"
                  placeholder="Min 8 chars, mixed case, digit, special"
                  required
                />
                {newPassword.length > 0 && (
                  <div className="settings-page__strength">
                    <div className="settings-page__strength-bar">
                      <div
                        className="settings-page__strength-fill"
                        style={{
                          width: `${(passwordStrength / PASSWORD_RULES.length) * 100}%`,
                          background: passwordStrength <= 2 ? '#dc3545' : passwordStrength <= 4 ? '#f0ad4e' : '#5cb85c',
                        }}
                      />
                    </div>
                    <span className="settings-page__strength-label">
                      {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 4 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                )}
              </div>
              <div className="settings-page__field">
                <label className="settings-page__label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="settings-page__input"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passwordSaving}
                className="settings-page__submit"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="settings-page__section settings-page__section--danger">
            <h2 className="settings-page__section-title settings-page__section-title--danger">Danger Zone</h2>
            <p className="settings-page__danger-text">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            {deleteMsg && (
              <div className={`settings-page__msg settings-page__msg--${deleteMsg.type}`}>
                {deleteMsg.text}
              </div>
            )}
            <div className="settings-page__field">
              <label className="settings-page__label">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="settings-page__input settings-page__input--danger"
                placeholder="DELETE"
              />
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}
              className="settings-page__submit settings-page__submit--danger"
            >
              {deleting ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
