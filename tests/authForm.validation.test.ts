import { describe, expect, it } from 'vitest';
import { validateSignupSubmission } from '../src/hooks/useAuthForm';

describe('validateSignupSubmission', () => {
  it('requires a display name for Google signup', () => {
    expect(
      validateSignupSubmission({
        displayName: '   ',
        requirePassword: false,
      }),
    ).toEqual({
      error: 'Display name is required',
      displayName: null,
    });
  });

  it('normalizes display name for Google signup when password is not required', () => {
    expect(
      validateSignupSubmission({
        displayName: '  Captain Rex  ',
        requirePassword: false,
      }),
    ).toEqual({
      error: null,
      displayName: 'Captain Rex',
    });
  });

  it('validates password rules for email signup', () => {
    expect(
      validateSignupSubmission({
        displayName: 'Captain Rex',
        password: 'abc',
        confirmPassword: 'abc',
        requirePassword: true,
      }),
    ).toEqual({
      error: 'Password requires: 8+ characters, Uppercase letter, A digit, Special character',
      displayName: null,
    });
  });

  it('rejects mismatched passwords for email signup', () => {
    expect(
      validateSignupSubmission({
        displayName: 'Captain Rex',
        password: 'Password1!',
        confirmPassword: 'Password2!',
        requirePassword: true,
      }),
    ).toEqual({
      error: 'Passwords do not match',
      displayName: null,
    });
  });
});
