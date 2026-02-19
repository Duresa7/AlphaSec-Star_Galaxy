import type { Faction } from '@/types';
import { clamp } from '@/utils/math';

const FACTION_ORDER: Faction[] = [
  'sith_empire',
  'galactic_republic',
  'neutral',
  'contested',
  'hutt_cartel',
];

interface NormalizeFactionControlParams {
  current: Partial<Record<Faction, number>>;
  editedFaction: Faction;
  editedValue: number;
}

export function normalizeFactionControl({
  current,
  editedFaction,
  editedValue,
}: NormalizeFactionControlParams): Partial<Record<Faction, number>> {
  const clampedEditedValue = clamp(Math.round(editedValue), 0, 100);
  const activeOtherFactions = FACTION_ORDER.filter(
    (faction) => faction !== editedFaction && (current[faction] ?? 0) > 0,
  );

  if (activeOtherFactions.length === 0) {
    return { [editedFaction]: 100 };
  }

  const remaining = 100 - clampedEditedValue;
  if (remaining <= 0) {
    return { [editedFaction]: 100 };
  }

  const totalOtherWeight = activeOtherFactions.reduce((sum, faction) => sum + (current[faction] ?? 0), 0);
  if (totalOtherWeight <= 0) {
    return { [editedFaction]: 100 };
  }

  const baseAllocations = new Map<Faction, number>();
  const fractionalParts = new Map<Faction, number>();
  let assigned = 0;

  for (const faction of activeOtherFactions) {
    const rawAllocation = ((current[faction] ?? 0) / totalOtherWeight) * remaining;
    const baseAllocation = Math.floor(rawAllocation);
    baseAllocations.set(faction, baseAllocation);
    fractionalParts.set(faction, rawAllocation - baseAllocation);
    assigned += baseAllocation;
  }

  let remainder = remaining - assigned;
  const remainderPriority = [...activeOtherFactions].sort((left, right) => {
    const fractionalDiff = (fractionalParts.get(right) ?? 0) - (fractionalParts.get(left) ?? 0);
    if (fractionalDiff !== 0) return fractionalDiff;
    return FACTION_ORDER.indexOf(left) - FACTION_ORDER.indexOf(right);
  });

  for (let i = 0; i < remainderPriority.length && remainder > 0; i += 1) {
    const faction = remainderPriority[i];
    baseAllocations.set(faction, (baseAllocations.get(faction) ?? 0) + 1);
    remainder -= 1;
  }

  const normalized: Partial<Record<Faction, number>> = { [editedFaction]: clampedEditedValue };
  for (const faction of activeOtherFactions) {
    normalized[faction] = baseAllocations.get(faction) ?? 0;
  }

  return normalized;
}
