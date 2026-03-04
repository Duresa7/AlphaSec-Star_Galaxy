interface CustomShipQuantityControlProps {
  ariaLabel: string;
  clamp: (value: number) => number;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}

export function CustomShipQuantityControl({
  ariaLabel,
  clamp,
  max,
  min,
  onChange,
  value,
}: CustomShipQuantityControlProps) {
  return (
    <div className="fleet-custom-qty-row">
      <button
        className="fleet-custom-qty-btn"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        title="Decrease quantity"
      >
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M20 12H4" />
        </svg>
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="holo-input fleet-custom-qty-input"
        aria-label={ariaLabel}
      />
      <button
        className="fleet-custom-qty-btn"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        title="Increase quantity"
      >
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
