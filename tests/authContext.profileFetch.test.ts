import { describe, expect, it } from 'vitest';
import {
  getProfileFetchMode,
  shouldFetchProfileForEvent,
} from '../src/contexts/authContextHelpers';

describe('getProfileFetchMode', () => {
  it('returns null when there is no next session user', () => {
    expect(
      getProfileFetchMode({
        previousSessionUserId: 'user-1',
        nextSessionUserId: null,
        resolvedProfileUserId: 'user-1',
      }),
    ).toBeNull();
  });

  it('returns initial when the session user changes', () => {
    expect(
      getProfileFetchMode({
        previousSessionUserId: 'user-1',
        nextSessionUserId: 'user-2',
        resolvedProfileUserId: 'user-1',
      }),
    ).toBe('initial');
  });

  it('returns initial when current session user profile has not resolved yet', () => {
    expect(
      getProfileFetchMode({
        previousSessionUserId: 'user-1',
        nextSessionUserId: 'user-1',
        resolvedProfileUserId: null,
      }),
    ).toBe('initial');
  });

  it('returns background when the same session user already has a resolved profile', () => {
    expect(
      getProfileFetchMode({
        previousSessionUserId: 'user-1',
        nextSessionUserId: 'user-1',
        resolvedProfileUserId: 'user-1',
      }),
    ).toBe('background');
  });
});

describe('shouldFetchProfileForEvent', () => {
  it('always fetches when mode is initial', () => {
    expect(shouldFetchProfileForEvent('TOKEN_REFRESHED', 'initial')).toBe(true);
  });

  it('fetches background profile updates for manual refresh', () => {
    expect(shouldFetchProfileForEvent('MANUAL', 'background')).toBe(true);
  });

  it('fetches background profile updates for relevant auth events', () => {
    expect(shouldFetchProfileForEvent('INITIAL_SESSION', 'background')).toBe(true);
    expect(shouldFetchProfileForEvent('SIGNED_IN', 'background')).toBe(true);
    expect(shouldFetchProfileForEvent('USER_UPDATED', 'background')).toBe(true);
  });

  it('skips background profile fetch on token refresh to avoid UI churn', () => {
    expect(shouldFetchProfileForEvent('TOKEN_REFRESHED', 'background')).toBe(false);
  });

  it('returns false when no fetch mode exists', () => {
    expect(shouldFetchProfileForEvent('SIGNED_IN', null)).toBe(false);
  });
});
