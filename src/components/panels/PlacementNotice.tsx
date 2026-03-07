interface PlacementNoticeProps {
  active: boolean;
  entityLabel: string;
  onCancel: () => void;
}

export function PlacementNotice({ active, entityLabel, onCancel }: PlacementNoticeProps) {
  if (!active) return null;

  return (
    <div className="holo-placement-notice">
      <p className="holo-placement-notice-text animate-pulse">
        Click on the map to place your {entityLabel}
      </p>
      <button onClick={onCancel} className="holo-text-button mt-2">
        Cancel
      </button>
    </div>
  );
}
