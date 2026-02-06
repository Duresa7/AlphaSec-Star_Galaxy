import { describe, expect, it } from 'vitest';
import { shouldRecenterTopdown } from '../src/components/three/cameraTransition';

describe('shouldRecenterTopdown', () => {
  it('does not recenter while already in topdown', () => {
    expect(shouldRecenterTopdown('topdown', 'topdown')).toBe(false);
  });

  it('recenters when entering topdown from another mode', () => {
    expect(shouldRecenterTopdown('topdown', 'system')).toBe(true);
    expect(shouldRecenterTopdown('topdown', 'fleet')).toBe(true);
    expect(shouldRecenterTopdown('topdown', null)).toBe(true);
  });

  it('never recenters outside topdown mode', () => {
    expect(shouldRecenterTopdown('system', 'topdown')).toBe(false);
    expect(shouldRecenterTopdown('fleet', 'topdown')).toBe(false);
  });
});
