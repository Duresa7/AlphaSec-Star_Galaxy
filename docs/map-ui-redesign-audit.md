# Interactive Map UI Redesign Audit

Last updated: 2026-02-28

## Style Approach Baseline

- Keep a single holo glass language for map overlays: translucent surfaces, soft white borders, amber accent actions, Oxanium/Orbitron labeling.
- Prefer shared `holo-*` classes over component-level inline style objects.
- Use explicit active states (`.is-active`) for module controls and tab controls.
- Keep destructive actions visually standardized with one danger button treatment.

## Active Map UI Inventory

| Component | Mounted in `MapPage` | Status | Notes | Action |
| --- | --- | --- | --- | --- |
| `IconRail` | Yes | Complete | Migrated to reusable rail classes, removed embedded `<style>` block. | None |
| `BottomActionBar` | Yes | Complete | Uses shared toolbar and active button states. | None |
| `SearchBar` | Yes | Complete | Uses current panel/input primitives with minimal inline styling. | None |
| `TimelineControl` | Yes | Complete | Year card + input now use shared classes. | None |
| `GalaxyOverview` | Yes | Complete | Row/metric rendering moved to shared classes. | None |
| `MapControlsPanel` | Yes | Complete | Tab strip switched to reusable tab classes. | None |
| `InfoPanel` | Yes | Complete | Shell already aligned to shared panel styling. | None |
| `SystemInfo` | Yes | Complete | Destructive action aligned to shared danger button style. | None |
| `PlanetInfo` | Yes | Complete | High-inline areas were moved to shared holo utility classes; only dynamic color values remain inline. | None |
| `FleetInfo` | Yes | Complete | Primary styling aligned; destructive action standardized. | None |
| `AnomalyInfo` | Yes | Complete | Consistent with shared info panel language. | None |
| `CustomPlanetsPanel` | Yes (via bottom bar popover) | Complete | Header/chevrons/form labels/counts now use shared tokens; only dynamic color preview stays inline. | None |
| `CustomFleetsPanel` | Yes (via bottom bar popover) | Complete | Header/chevrons/counts now use shared tokens. | None |
| `FleetLogisticsModal` | Yes (via custom fleets flow) | Complete | Kept specialized modal layout, but aligned shared controls (`holo-close-button`, `holo-button`) and removed inline preview canvas styling. | None |
| `MapPage` utility chrome (zoom/admin/back/account/save/discard) | Yes | Complete | Converted to shared compact/action/account classes and removed hover JS style mutation. | None |

## Legacy / Unused Inventory

| Component | Mounted in current map flow | Status | Action Taken |
| --- | --- | --- | --- |
| `ControlsPanel` | No | Legacy | Removed |
| `FilterControls` | No | Legacy | Removed |

## Remaining Optional Follow-Ups

1. If you want stricter DRY rules, collapse dynamic inline color styles into CSS custom properties (for example `--faction-color`) set at the node level.
2. If you want one visual language for every surface, replace remaining `fleet-modal-*` specialized classes with generic `holo-*` panel primitives.
