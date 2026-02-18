import { describe, it, expect } from 'vitest';
import { normalizeFactionControl } from '../factionControl';

describe('normalizeFactionControl', () => {
  it('returns 100% for edited faction when no other factions exist', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 100 },
      editedFaction: 'sith_empire',
      editedValue: 50,
    });
    expect(result).toEqual({ sith_empire: 100 });
  });

  it('returns 100% for edited faction when value is 100', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 60, galactic_republic: 40 },
      editedFaction: 'sith_empire',
      editedValue: 100,
    });
    expect(result).toEqual({ sith_empire: 100 });
  });

  it('distributes remaining proportionally to other factions', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 50, galactic_republic: 30, neutral: 20 },
      editedFaction: 'sith_empire',
      editedValue: 40,
    });
    // remaining = 60, other weights: republic=30, neutral=20 (total=50)
    // republic: 60 * 30/50 = 36, neutral: 60 * 20/50 = 24
    expect(result.sith_empire).toBe(40);
    expect(result.galactic_republic).toBe(36);
    expect(result.neutral).toBe(24);
    // Must sum to 100
    const total = Object.values(result).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBe(100);
  });

  it('always sums to exactly 100', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 33, galactic_republic: 33, neutral: 34 },
      editedFaction: 'sith_empire',
      editedValue: 10,
    });
    const total = Object.values(result).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBe(100);
  });

  it('clamps edited value to 0-100', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 50, galactic_republic: 50 },
      editedFaction: 'sith_empire',
      editedValue: 150,
    });
    expect(result).toEqual({ sith_empire: 100 });
  });

  it('handles zero edited value', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 50, galactic_republic: 30, neutral: 20 },
      editedFaction: 'sith_empire',
      editedValue: 0,
    });
    expect(result.sith_empire).toBe(0);
    // remaining 100 distributed proportionally: republic=60, neutral=40
    expect(result.galactic_republic).toBe(60);
    expect(result.neutral).toBe(40);
  });

  it('ignores other factions with zero value', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 60, galactic_republic: 40, neutral: 0 },
      editedFaction: 'sith_empire',
      editedValue: 30,
    });
    expect(result.sith_empire).toBe(30);
    expect(result.galactic_republic).toBe(70);
    expect(result.neutral).toBeUndefined();
  });

  it('rounds fractional allocations and distributes remainder', () => {
    // 3 other factions with equal weight, remaining=100 → 33.33 each
    const result = normalizeFactionControl({
      current: { sith_empire: 0, galactic_republic: 10, neutral: 10, hutt_cartel: 10 },
      editedFaction: 'sith_empire',
      editedValue: 0,
    });
    const total = Object.values(result).reduce((a, b) => a + (b ?? 0), 0);
    expect(total).toBe(100);
    // Each gets floor(33.33)=33, remainder=1 goes to faction with highest fractional part
    const values = [result.galactic_republic, result.neutral, result.hutt_cartel];
    expect(values.sort()).toEqual([33, 33, 34]);
  });
});
