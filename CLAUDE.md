# CLAUDE.md

## Golden Rule
**NEVER commit or push anything without asking permission.**

---

## Privacy & Attribution
- Never include PII (names, emails, usernames) in commit messages, PR titles/descriptions, branch names, file paths, or any publicly visible text.
- Never reference AI agents or AI authorship anywhere.
- Never include a `Co-Authored-By` line mentioning Claude or Anthropic in commit messages.

---

## Git Workflow
- Always create a new branch per PR unless already on the correct one.
- Use the appropriate prefix:
  - `feat/` — new features
  - `fix/` — bug fixes
  - `chore/` — maintenance, config, dependencies
  - `refactor/` — restructuring without behavior change
  - `docs/` — documentation only
  - `test/` — adding or updating tests
  - `style/` — formatting, naming, no logic change
- Never use `git add .` — always add specific files.
- Commit messages must be clear and imperative — describe what changed and why.
- No vague messages (`"fix stuff"`, `"updates"`), emojis, em dashes, or AI references.

---

## Security
- Never commit secrets, API keys, credentials, tokens, or sensitive data.
- Double-check `.env` files, config files, and inline strings before pushing.
- Validate user input handling where applicable.
- Avoid insecure defaults and unsafe dependencies.
- Security is non-negotiable. Never loosen security constraints, bypass auth, or weaken RLS — regardless of context.

---

## Task Scope
- Only make changes directly requested or clearly necessary — nothing more.
- Do not add features, refactor, or make improvements beyond what was asked.
- Do not over-engineer — the minimum complexity needed is the right amount.
- Do not add error handling for scenarios that can't happen.
- When a request is unclear, ask rather than assume and proceed.
- Keep code simple and readable above all else. Clever is not better than clear.
- Only add fallbacks where failure is a real, expected possibility. Do not add fallbacks defensively for things that should never fail.

---

## File Management
- Prefer editing existing files over creating new ones.
- Do not create files unless strictly necessary for the task.

---

## File & Folder Structure
- Follow a professional, predictable structure — files should be easy to locate without explanation.
- Group by feature or domain, not by file type alone.
- File and folder names must be clear and self-documenting.
- Do not nest unnecessarily — flat is better than deeply nested when scope is small.
- New files go in the directory that already owns that concern.

---

## Dependencies
- Never add new packages or libraries without asking first.

---

## Destructive Actions
- Always ask before deleting files, force-pushing, or any action that cannot be undone.
- Never modify, delete, or truncate database data or schema without explicit permission.
- Never alter RLS policies, auth rules, or any security configuration without explicit permission.
- If an action risks data loss — even indirectly — stop and ask.

---

## Code Style
- Do not add comments to code you write unless the user asks, or the code is complex and requires additional context.
- Prioritize code quality over quantity.
- Do not add unnecessary generated commentary or low-value boilerplate notes before finalizing changes. Keep only comments that materially improve understanding.
- Structure and format code following the best practices of the language being used.

---

## Testing
- Run existing tests after making changes and fix any failures before considering work done.

---

## Before Committing
- Ensure code is clean, readable, and maintainable.
- Verify no security vulnerabilities or unsafe patterns.
- Resolve merge conflicts before approving or merging.

---

## Project Context

**Stack:** React 19 + TypeScript + Vite · Three.js / React Three Fiber / Drei (3D) · Zustand 5 (state) · Supabase (auth/db) · Tailwind CSS 4 · React Router 7 · Framer Motion · Tiptap (rich text editor) · Lucide React (icons)

**Commands:**
- `npm run dev` - Start dev server
- `npm run build` - TypeScript check + production build
- `npm run preview` - Preview production build locally
- `npm run lint` - ESLint + type check (--noEmit)
- `npm run test` - Run Vitest unit tests

**Architecture:**
- Path alias: `@/` → `src/`
- Entry: `src/main.tsx` (BrowserRouter + AuthProvider) → `src/App.tsx` (routes)
- All pages lazy-loaded via React.lazy() except LandingPage; wrapped with Suspense (null fallback)
- Code-split chunks: `three` (Three.js), `react-three` (@react-three/fiber + drei), `supabase`, `tiptap`
- Zustand stores in `src/store/`: `galaxyDataStore` (systems/fleets/planets), `galaxySelectionStore` (selected IDs + view mode), `galaxyUIStore` (panel/module toggles), `factionStore` (faction config)
- Auth: `AuthContext` in `src/contexts/` — PKCE flow, Google OAuth, timeout-guarded profile fetch
- Role-based routes in `src/components/auth/`: `ProtectedRoute`, `AdminRoute`, `BossmanRoute`, `GalaxyRoute`
- Supabase client: `src/lib/supabase.ts` — gracefully degrades (auth + persistence disabled) if env vars are missing
- Data layer: `src/data/supabaseStorage.ts` — typed serialization between client models and DB schema
- DB tables: `custom_systems`, `custom_fleets`, `custom_factions`, `app_settings`, `audit_logs`, `profiles`
- RPC functions: `fetch_audit_logs_page`, `fetch_audit_logs_total`, `fetch_user_management_profiles`, `set_user_role`
- Edge function: `delete-account`
- Types: all interfaces in `src/types/index.ts`; utilities in `src/utils/`

**Env vars needed:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PERSIST_SESSION` (see .env.example)

**Supabase MCP:** MCP tools are available for this project but require explicit permission before any use.
- Always ask before executing any MCP tool against the database.
- NEVER run destructive operations without explicit permission: DROP, DELETE, TRUNCATE, schema changes, or RLS/policy modifications.
- Read-only queries (list_tables, execute_sql SELECT) still require permission — ask first.

---

## Open a PR

> Steps 2 and 3 require `required_permissions: ['all']` — pre-commit hooks need global npm/node paths; `gh` CLI has TLS issues in sandboxed mode.

**Step 1:** Check state
```bash
git branch --show-current && git status -s && git diff HEAD --stat
```

**Step 2:** Commit + push (add specific files, never `git add .`)
```bash
git add <file1> <file2> && git commit -m "<msg>" && git push
```

**Step 3:** Open PR via `gh pr create`
