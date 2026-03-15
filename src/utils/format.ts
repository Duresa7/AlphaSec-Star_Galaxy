type DateStyle = 'short' | 'long' | 'compact';

export function formatDate(iso: string, style: DateStyle = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  };
  if (style !== 'compact') options.year = 'numeric';
  return new Date(iso).toLocaleDateString('en-US', options);
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatRegion(region: string): string {
  return region.split('_').map(capitalizeFirst).join(' ');
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
