import { describe, it, expect, vi } from 'vitest';
import { withTimeout } from '../withTimeout';

describe('withTimeout', () => {
  it('resolves when promise resolves before timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 1000, 'timed out');
    expect(result).toBe('ok');
  });

  it('rejects with timeout message when promise is too slow', async () => {
    vi.useFakeTimers();
    const slow = new Promise<string>(() => {});
    const pending = withTimeout(slow, 100, 'timed out');

    vi.advanceTimersByTime(100);

    await expect(pending).rejects.toThrow('timed out');
    vi.useRealTimers();
  });

  it('rejects with original error when promise rejects before timeout', async () => {
    const failing = Promise.reject(new Error('original error'));
    await expect(withTimeout(failing, 1000, 'timed out')).rejects.toThrow('original error');
  });

  it('clears timeout after promise resolves', async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

    await withTimeout(Promise.resolve('done'), 5000, 'timed out');

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    vi.useRealTimers();
  });

  it('clears timeout after promise rejects', async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

    await withTimeout(Promise.reject(new Error('fail')), 5000, 'timed out').catch(() => {});

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    vi.useRealTimers();
  });
});
