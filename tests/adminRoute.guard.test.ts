import { describe, expect, it } from 'vitest';
import { shouldShowAdminLoading } from '../src/utils/authGuard';

describe('shouldShowAdminLoading', () => {
  it('blocks while initial auth has not resolved', () => {
    expect(
      shouldShowAdminLoading({
        authResolved: false,
        authWaitExpired: false,
        hasSession: false,
        profileLoadingInitial: false,
      }),
    ).toBe(true);
  });

  it('allows rendering once auth resolved and no initial profile load is pending', () => {
    expect(
      shouldShowAdminLoading({
        authResolved: true,
        authWaitExpired: false,
        hasSession: true,
        profileLoadingInitial: false,
      }),
    ).toBe(false);
  });

  it('blocks during initial profile load for an authenticated session', () => {
    expect(
      shouldShowAdminLoading({
        authResolved: true,
        authWaitExpired: false,
        hasSession: true,
        profileLoadingInitial: true,
      }),
    ).toBe(true);
  });

  it('stops blocking when guard timeout expires', () => {
    expect(
      shouldShowAdminLoading({
        authResolved: true,
        authWaitExpired: true,
        hasSession: true,
        profileLoadingInitial: true,
      }),
    ).toBe(false);
  });
});
