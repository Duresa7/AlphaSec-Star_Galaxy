import { describe, expect, it } from 'vitest';
import { normalizeFactionControl } from '../src/utils/factionControl';

const FACTION_ORDER = ['sith_empire', 'galactic_republic', 'neutral', 'contested', 'hutt_cartel'];

const sumControl = (control: Partial<Record<string, number>>): number =>
  Object.values(control).reduce<number>((sum, value) => sum + (value ?? 0), 0);

describe('normalizeFactionControl', () => {
  it('pins the edited faction and keeps totals at 100', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 60, galactic_republic: 40 },
      editedFaction: 'sith_empire',
      editedValue: 70,
      factionOrder: FACTION_ORDER,
    });

    expect(result.sith_empire).toBe(70);
    expect(result.galactic_republic).toBe(30);
    expect(sumControl(result)).toBe(100);
  });

  it('distributes rounding remainder deterministically', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 33, galactic_republic: 1, neutral: 1 },
      editedFaction: 'sith_empire',
      editedValue: 33,
      factionOrder: FACTION_ORDER,
    });

    expect(result.sith_empire).toBe(33);
    expect(result.galactic_republic).toBe(34);
    expect(result.neutral).toBe(33);
    expect(sumControl(result)).toBe(100);
  });

  it('keeps single-faction planets at 100', () => {
    const result = normalizeFactionControl({
      current: { sith_empire: 100 },
      editedFaction: 'sith_empire',
      editedValue: 15,
      factionOrder: FACTION_ORDER,
    });

    expect(result).toEqual({ sith_empire: 100 });
    expect(sumControl(result)).toBe(100);
  });
});
