import { useState } from 'react';
import { useFactionStore } from '@/store/factionStore';
import { useGalaxyDataStore } from '@/store/galaxyDataStore';
import { useGalaxyUIStore } from '@/store/galaxyUIStore';
import type { FactionConfig } from '@/types';

function generateFactionId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slug}_${rand}`;
}

function FactionRow({
  faction,
  onEdit,
  onDelete,
}: {
  faction: FactionConfig;
  onEdit: (f: FactionConfig) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 py-2 px-3"
      style={{
        background: 'rgba(200, 170, 110, 0.03)',
        border: '1px solid rgba(200, 170, 110, 0.08)',
        borderRadius: '8px',
      }}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: faction.barColor, boxShadow: `0 0 0 2px ${faction.barColor}40` }}
      />
      <span className="flex-1 text-[12px] truncate holo-body-text" style={{ color: faction.barColor }}>
        {faction.label}
      </span>
      <button
        onClick={() => onEdit(faction)}
        className="text-[9px] uppercase tracking-wide holo-label-orbitron hover:underline"
        style={{ color: 'var(--holo-cyan)' }}
      >
        Edit
      </button>
      {!faction.isBuiltin && (
        <button
          onClick={() => onDelete(faction.id)}
          className="text-[9px] uppercase tracking-wide holo-label-orbitron hover:underline"
          style={{ color: '#DC143C' }}
        >
          Del
        </button>
      )}
    </div>
  );
}

function FactionEditForm({
  faction,
  onSave,
  onCancel,
}: {
  faction: FactionConfig;
  onSave: (updates: Partial<Pick<FactionConfig, 'label' | 'markerColor' | 'barColor'>>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(faction.label);
  const [markerColor, setMarkerColor] = useState(faction.markerColor);
  const [barColor, setBarColor] = useState(faction.barColor);

  return (
    <div
      className="space-y-2 p-3"
      style={{
        background: 'rgba(0, 240, 255, 0.04)',
        border: '1px solid rgba(0, 240, 255, 0.15)',
        borderRadius: '8px',
      }}
    >
      <div className="text-[9px] uppercase tracking-wide holo-label-orbitron" style={{ color: 'var(--holo-cyan)' }}>
        Editing: {faction.label}
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="holo-input w-full text-[12px]"
        style={{ padding: '4px 8px' }}
        placeholder="Faction name"
        maxLength={30}
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-[9px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Marker</span>
          <input
            type="color"
            value={markerColor}
            onChange={(e) => setMarkerColor(e.target.value)}
            className="w-6 h-6 border cursor-pointer bg-transparent"
            style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Accent</span>
          <input
            type="color"
            value={barColor}
            onChange={(e) => setBarColor(e.target.value)}
            className="w-6 h-6 border cursor-pointer bg-transparent"
            style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const updates: Partial<Pick<FactionConfig, 'label' | 'markerColor' | 'barColor'>> = {};
            if (label.trim() && label !== faction.label) updates.label = label.trim();
            if (markerColor !== faction.markerColor) updates.markerColor = markerColor;
            if (barColor !== faction.barColor) updates.barColor = barColor;
            if (Object.keys(updates).length > 0) onSave(updates);
            else onCancel();
          }}
          className="text-[9px] uppercase tracking-wide holo-label-orbitron"
          style={{ color: 'var(--holo-cyan)' }}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-[9px] uppercase tracking-wide holo-label-orbitron"
          style={{ color: 'var(--holo-text-muted)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function FactionManagementPanel() {
  const factions = useFactionStore((s) => s.factions);
  const createFaction = useFactionStore((s) => s.createFaction);
  const updateFaction = useFactionStore((s) => s.updateFaction);
  const removeFaction = useFactionStore((s) => s.removeFaction);
  const syncFactionFilters = useGalaxyUIStore((s) => s.syncFactionFilters);
  const getFactionIds = useFactionStore((s) => s.getFactionIds);
  const systems = useGalaxyDataStore((s) => s.systems);
  const fleets = useGalaxyDataStore((s) => s.fleets);
  const updatePlanetStats = useGalaxyDataStore((s) => s.updatePlanetStats);
  const updateFleetStats = useGalaxyDataStore((s) => s.updateFleetStats);

  const [collapsed, setCollapsed] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMarkerColor, setNewMarkerColor] = useState('#4DD0E1');
  const [newBarColor, setNewBarColor] = useState('#4DD0E1');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const editingFaction = editingId ? factions.find((f) => f.id === editingId) : null;

  const getAffectedCount = (factionId: string) => {
    let planets = 0;
    let fleetCount = 0;
    for (const system of systems) {
      for (const planet of system.planets) {
        if (planet.faction === factionId) planets++;
      }
    }
    for (const fleet of fleets) {
      if (fleet.faction === factionId) fleetCount++;
    }
    return { planets, fleets: fleetCount };
  };

  const handleDelete = async (id: string) => {
    const success = await removeFaction(id);
    if (!success) return;
    // Reassign affected entities to neutral
    for (const system of systems) {
      for (const planet of system.planets) {
        if (planet.faction === id) {
          updatePlanetStats(system.id, planet.id, { faction: 'neutral' });
        }
      }
    }
    for (const fleet of fleets) {
      if (fleet.faction === id) {
        updateFleetStats(fleet.id, { faction: 'neutral' });
      }
    }
    syncFactionFilters(getFactionIds());
    setDeleteConfirmId(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = generateFactionId(newName.trim());
    await createFaction({ id, label: newName.trim(), markerColor: newMarkerColor, barColor: newBarColor });
    syncFactionFilters(useFactionStore.getState().getFactionIds());
    setNewName('');
    setNewMarkerColor('#4DD0E1');
    setNewBarColor('#4DD0E1');
    setShowCreate(false);
  };

  return (
    <div className="holo-panel" style={{ marginTop: '0' }}>
      <label
        className="holo-label holo-section-header"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.7 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          Factions
        </span>
        <span aria-hidden="true" style={{ color: 'var(--holo-amber)', opacity: 0.7 }}>
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </label>

      {!collapsed && (
        <div className="space-y-2 mt-3">
          {factions.map((f) =>
            editingId === f.id && editingFaction ? (
              <FactionEditForm
                key={f.id}
                faction={editingFaction}
                onSave={(updates) => {
                  updateFaction(f.id, updates);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : deleteConfirmId === f.id ? (
              <div
                key={f.id}
                className="p-3 space-y-2"
                style={{
                  background: 'rgba(220, 20, 60, 0.06)',
                  border: '1px solid rgba(220, 20, 60, 0.2)',
                  borderRadius: '8px',
                }}
              >
                <div className="text-[10px] holo-label-orbitron" style={{ color: '#DC143C' }}>
                  Delete "{f.label}"?
                </div>
                {(() => {
                  const affected = getAffectedCount(f.id);
                  return (affected.planets > 0 || affected.fleets > 0) ? (
                    <div className="text-[10px] holo-body-text" style={{ color: 'var(--holo-text-muted)' }}>
                      {affected.planets} planet{affected.planets !== 1 ? 's' : ''} and {affected.fleets} fleet{affected.fleets !== 1 ? 's' : ''} will be reassigned to Neutral.
                    </div>
                  ) : null;
                })()}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                    style={{ color: '#DC143C' }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                    style={{ color: 'var(--holo-text-muted)' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <FactionRow
                key={f.id}
                faction={f}
                onEdit={(faction) => setEditingId(faction.id)}
                onDelete={(id) => setDeleteConfirmId(id)}
              />
            ),
          )}

          {showCreate ? (
            <div
              className="space-y-2 p-3"
              style={{
                background: 'rgba(0, 240, 255, 0.04)',
                border: '1px solid rgba(0, 240, 255, 0.15)',
                borderRadius: '8px',
              }}
            >
              <div className="text-[9px] uppercase tracking-wide holo-label-orbitron" style={{ color: 'var(--holo-cyan)' }}>
                New Faction
              </div>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="holo-input w-full text-[12px]"
                style={{ padding: '4px 8px' }}
                placeholder="Faction name"
                maxLength={30}
                autoFocus
              />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Marker</span>
                  <input
                    type="color"
                    value={newMarkerColor}
                    onChange={(e) => setNewMarkerColor(e.target.value)}
                    className="w-6 h-6 border cursor-pointer bg-transparent"
                    style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] holo-label-orbitron" style={{ color: 'var(--holo-text-muted)' }}>Accent</span>
                  <input
                    type="color"
                    value={newBarColor}
                    onChange={(e) => setNewBarColor(e.target.value)}
                    className="w-6 h-6 border cursor-pointer bg-transparent"
                    style={{ borderColor: 'rgba(200, 170, 110, 0.2)' }}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="text-[9px] uppercase tracking-wide holo-label-orbitron disabled:opacity-30"
                  style={{ color: 'var(--holo-cyan)' }}
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); }}
                  className="text-[9px] uppercase tracking-wide holo-label-orbitron"
                  style={{ color: 'var(--holo-text-muted)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="holo-button w-full"
              style={{ padding: '6px 16px' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Faction</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
