import { useState } from 'react';
import { useFactionStore } from '@/store/factionStore';

export function EditableInfoRow({
  label,
  value,
  placeholder,
  editable = true,
  editing,
  draft,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  placeholder: string;
  editable?: boolean;
  editing: boolean;
  draft: string;
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-between items-center text-[14px]">
      <span className="holo-label-inline">{label}</span>
      {!editable ? (
        <span className="holo-value-inline">
          {value || placeholder}
        </span>
      ) : editing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            autoFocus
            className="holo-input w-28 text-right"
            style={{ padding: '2px 6px', fontSize: '12px' }}
          />
          <button onClick={onSave} className="text-xs px-1" style={{ color: 'var(--holo-cyan)' }}>
            &#10003;
          </button>
        </div>
      ) : (
        <span
          onClick={onStartEdit}
          className="cursor-pointer hover:underline holo-value-inline"
          style={{ textDecorationColor: 'var(--holo-cyan)' }}
          title="Click to edit"
        >
          {value || placeholder}
        </span>
      )}
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[14px]">
      <span className="holo-label-inline">{label}</span>
      <span className="holo-value-inline">{value}</span>
    </div>
  );
}

export function AddFactionControl({ existingFactions, onAdd }: { existingFactions: string[]; onAdd: (faction: string) => void }) {
  const [open, setOpen] = useState(false);
  const factions = useFactionStore((s) => s.factions);
  const getFactionLabel = useFactionStore((s) => s.getFactionLabel);
  const getFactionBarColor = useFactionStore((s) => s.getFactionBarColor);
  const available = factions.filter(f => !existingFactions.includes(f.id));

  if (available.length === 0) return null;

  return open ? (
    <div className="flex flex-wrap gap-1 mt-1">
      {available.map(f => (
        <button
          key={f.id}
          onClick={() => { onAdd(f.id); setOpen(false); }}
          className="holo-badge text-[9px] cursor-pointer hover:bg-amber-500/10 transition-colors"
          style={{ borderColor: getFactionBarColor(f.id), color: getFactionBarColor(f.id) }}
        >
          + {getFactionLabel(f.id)}
        </button>
      ))}
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="text-[9px] mt-1 hover:underline holo-label-orbitron"
      style={{ color: 'var(--holo-cyan)' }}
    >
      + Add Faction Influence
    </button>
  );
}

export function formatRegion(region: string): string {
  return region.split('_').map(capitalizeFirst).join(' ');
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
