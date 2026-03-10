type DateStyle = 'short' | 'long' | 'compact';

export function formatDate(iso: string, style: DateStyle = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {
    month: style === 'long' ? 'long' : 'short',
    day: 'numeric',
  };
  if (style !== 'compact') options.year = 'numeric';
  return new Date(iso).toLocaleDateString('en-US', options);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
