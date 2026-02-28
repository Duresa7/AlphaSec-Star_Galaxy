const FILTER_COLOR_MAP: Record<string, string> = {
  blue: '#64B5F6',
  yellow: '#C8AA6E',
  red: '#DC143C',
  orange: '#FFA726',
  gray: '#9E9E9E',
  purple: '#AB47BC',
  cyan: '#00F0FF',
  olive: '#8B9A46',
};

interface FilterBoxProps {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: 'blue' | 'yellow' | 'red' | 'orange' | 'gray' | 'purple' | 'cyan' | 'olive';
  hexColor?: string;
}

export function FilterBox({ active, onClick, label, color = 'blue', hexColor }: FilterBoxProps) {
  const activeColor = hexColor || FILTER_COLOR_MAP[color];

  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-3 border transition-all duration-250 cursor-pointer overflow-hidden"
      style={{
        background: active ? `rgba(200, 170, 110, 0.06)` : 'rgba(5, 5, 8, 0.4)',
        borderColor: active ? `${activeColor}50` : 'rgba(200, 170, 110, 0.08)',
        borderRadius: '8px',
      }}
    >
      <span
        className="text-[11px] font-medium tracking-wider uppercase holo-label-orbitron"
        style={{
          color: active ? activeColor : 'rgba(200, 170, 110, 0.3)',
        }}
      >
        {label}
      </span>
      {active && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at center, ${activeColor}, transparent 70%)` }}
        />
      )}
    </button>
  );
}
