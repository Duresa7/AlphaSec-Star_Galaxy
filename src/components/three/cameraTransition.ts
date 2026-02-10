type ViewMode = 'topdown' | 'system' | 'fleet';

export function shouldRecenterTopdown(
  viewMode: ViewMode,
  previousViewMode: ViewMode | null,
): boolean {
  if (viewMode !== 'topdown') {
    return false;
  }

  return previousViewMode !== 'topdown';
}
