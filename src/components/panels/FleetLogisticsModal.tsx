import { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ShipModel } from '@/components/three/ModelLoader';
import { shipCatalog } from '@/data/shipCatalog';
import type { ShipCatalogEntry } from '@/data/shipCatalog';
import type { Faction, FleetShipEntry } from '@/types';

const FACTION_OPTIONS: { value: Faction; label: string; description: string }[] = [
  {
    value: 'galactic_republic',
    label: 'Galactic Republic',
    description: 'Versatile and resilient, the Republic relies on balanced tactics and heavy armor.',
  },
  {
    value: 'sith_empire',
    label: 'Sith Empire',
    description: 'Aggressive and ruthless, the Empire overwhelms enemies with superior firepower.',
  },
  {
    value: 'hutt_cartel',
    label: 'Hutt Cartel',
    description: 'Criminal enforcers using modified civilian craft and mercenary crews.',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    description: 'Independent forces unaligned to any major galactic power.',
  },
  {
    value: 'contested',
    label: 'Contested',
    description: 'Disputed forces with mixed loyalties and uncertain allegiance.',
  },
];

interface ShipCardPreviewProps {
  modelType: 'sith' | 'republic';
}

function ShipCardPreview({ modelType }: ShipCardPreviewProps) {
  return (
    <Canvas
      camera={{ position: [1.5, 0.9, 2.2], fov: 32 }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      gl={{ alpha: true, antialias: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, 2, -3]} intensity={0.4} color="#4DD0E1" />
      <Environment preset="night" background={false} />
      <Suspense fallback={null}>
        <ShipModel
          type={modelType}
          position={new THREE.Vector3(0, 0, 0)}
          scale={2}
          rotation={[0, -Math.PI / 5, 0]}
        />
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}

interface FleetLogisticsModalProps {
  onConfirm: (data: { name: string; faction: Faction; shipCount: number }) => void;
  onCancel: () => void;
}

export function FleetLogisticsModal({ onConfirm, onCancel }: FleetLogisticsModalProps) {
  const [fleetName, setFleetName] = useState('Alpha Squadron');
  const [faction, setFaction] = useState<Faction>('galactic_republic');
  const [hangar, setHangar] = useState<FleetShipEntry[]>([]);

  const totalUnits = useMemo(
    () => hangar.reduce((sum, entry) => sum + entry.quantity, 0),
    [hangar],
  );

  const factionDescription = useMemo(
    () => FACTION_OPTIONS.find((f) => f.value === faction)?.description ?? '',
    [faction],
  );

  const addShipToHangar = (ship: ShipCatalogEntry) => {
    setHangar((prev) => {
      const existing = prev.find((e) => e.catalogId === ship.id);
      if (existing) {
        return prev.map((e) =>
          e.catalogId === ship.id ? { ...e, quantity: e.quantity + 1 } : e,
        );
      }
      return [
        ...prev,
        { catalogId: ship.id, name: ship.name, shipClass: ship.shipClass, quantity: 1 },
      ];
    });
  };

  const removeShipFromHangar = (catalogId: string) => {
    setHangar((prev) => {
      const existing = prev.find((e) => e.catalogId === catalogId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((e) => e.catalogId !== catalogId);
      }
      return prev.map((e) =>
        e.catalogId === catalogId ? { ...e, quantity: e.quantity - 1 } : e,
      );
    });
  };

  const handleConfirm = () => {
    if (!fleetName.trim() || totalUnits === 0) return;
    onConfirm({ name: fleetName.trim(), faction, shipCount: totalUnits });
  };

  return (
    <div className="fleet-modal-overlay" onClick={onCancel}>
      <div className="fleet-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fleet-modal-header">
          <div className="fleet-modal-header-left">
            <svg
              className="fleet-modal-header-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.610L5 14.5" />
            </svg>
            <h2 className="fleet-modal-title">Fleet Logistics Interface</h2>
          </div>
          <button className="fleet-modal-close" onClick={onCancel}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="fleet-modal-body">
          {/* Left — Ship Catalog */}
          <div className="fleet-modal-catalog">
            <div className="fleet-ship-grid">
              {shipCatalog.map((ship) => (
                <div key={ship.id} className="fleet-ship-card">
                  <div className="fleet-ship-card-preview">
                    <ShipCardPreview modelType={ship.modelType} />
                    <span className="fleet-ship-class-badge">{ship.shipClass}</span>
                  </div>
                  <div className="fleet-ship-card-info">
                    <h3 className="fleet-ship-card-name">{ship.name}</h3>
                    <p className="fleet-ship-card-desc">{ship.description}</p>
                    <button
                      className="fleet-ship-add-btn"
                      onClick={() => addShipToHangar(ship)}
                    >
                      Add to Fleet
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Configuration & Hangar */}
          <div className="fleet-modal-config">
            {/* Fleet Designation */}
            <div className="fleet-config-section">
              <label className="fleet-config-label">Fleet Designation:</label>
              <input
                type="text"
                value={fleetName}
                onChange={(e) => setFleetName(e.target.value)}
                className="holo-input fleet-config-input"
                placeholder="Enter fleet name..."
                maxLength={30}
              />
            </div>

            {/* Allegiance */}
            <div className="fleet-config-section">
              <label className="fleet-config-label">Allegiance</label>
              <div className="fleet-config-select-wrap">
                <select
                  value={faction}
                  onChange={(e) => setFaction(e.target.value as Faction)}
                  className="holo-input fleet-config-select"
                >
                  {FACTION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="fleet-config-faction-desc">{factionDescription}</p>
            </div>

            {/* Deployable Units */}
            <div className="fleet-config-section">
              <div className="fleet-config-units-header">
                <span className="fleet-config-label">Deployable Units</span>
                <span className="fleet-config-units-count">{totalUnits} Units</span>
              </div>
            </div>

            {/* Hangar */}
            <div className="fleet-hangar">
              {hangar.length === 0 ? (
                <div className="fleet-hangar-empty">
                  <div className="fleet-hangar-empty-border">
                    <span>Hangar Empty</span>
                  </div>
                </div>
              ) : (
                <div className="fleet-hangar-list">
                  {hangar.map((entry) => (
                    <div key={entry.catalogId} className="fleet-hangar-entry">
                      <div className="fleet-hangar-entry-info">
                        <span className="fleet-hangar-entry-name">{entry.name}</span>
                        <span className="fleet-hangar-entry-class">{entry.shipClass}</span>
                      </div>
                      <div className="fleet-hangar-entry-controls">
                        <span className="fleet-hangar-entry-qty">×{entry.quantity}</span>
                        <button
                          className="fleet-hangar-remove-btn"
                          onClick={() => removeShipFromHangar(entry.catalogId)}
                          title="Remove one"
                        >
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M20 12H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="fleet-modal-actions">
              <button
                className="fleet-confirm-btn"
                onClick={handleConfirm}
                disabled={!fleetName.trim() || totalUnits === 0}
              >
                Confirm Fleet
              </button>
              <button className="fleet-cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
