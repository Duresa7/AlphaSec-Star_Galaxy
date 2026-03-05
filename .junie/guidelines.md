# Project Guidelines
## 1. Privacy & Attribution

> **NEVER include PII (Personally Identifiable Information) in:**
>
> - Commit messages
> - PR titles or descriptions
> - Branch names
> - File paths or names mentioned in commits/PRs
> - Any text that will be publicly visible
>
> **NEVER reference AI agents or AI authorship — anywhere.**

---

## 2. Git Workflow

### 2.1 Check State

Run a single command to assess the current branch and working tree:

```bash
git branch --show-current && git status -s && git diff HEAD --stat
```

### 2.2 Branch Strategy

- **Always create a new branch for each PR** unless already on the correct one.
- If on `main` or `master`, or if the current branch doesn't match the work: create a branch with the appropriate prefix:

| Prefix                | Purpose                        |
| --------------------- | ------------------------------ |
| `feat/<description>`  | New features                   |
| `fix/<description>`   | Bug fixes                      |
| `chore/<description>` | Maintenance, refactoring, etc. |

```bash
git checkout -b feat/<description>
```

> **Note:** `git checkout -b` requires `required_permissions: ['git_write']`

### 2.3 Commit & Push

> **Requires** `required_permissions: ['all']`
> (Pre-commit hooks need global npm/node paths; `gh` CLI has TLS issues in sandboxed mode.)

**If staged files exist** — respect the user's selection:

```bash
git commit -m "<msg>" && git push
```

**If unstaged files exist** — add specific files, **never** `git add .`:

```bash
git add <file1> <file2> ... && git commit -m "<msg>" && git push
```

### 2.4 Commit Message Rules

- Use clear, imperative tense — describe _what_ changed and _why_.
- Avoid vague messages like `"fix stuff"` or `"updates"`.
- Keep branch history clean.
- Do not include emojis or em dashes in commit messages.

### 2.5 Pre-Commit Cleanup

- Remove any unnecessary AI-generated comments (e.g., `// Added for accessibility`, `// Handle edge case`) before committing. Comments that are genuinely important for understanding the code are fine to keep.

---

## 3. Security

- **Never commit secrets, API keys, credentials, tokens, or any sensitive data.** Double-check `.env` files, config files, and inline strings before pushing.
- Validate user input handling where applicable.
- Avoid insecure defaults and unsafe dependencies.

---

## 4. Code Review Requirements

- Ensure code is clean, readable, and maintainable.
- Verify no security vulnerabilities or unsafe patterns are introduced.
- Check for and resolve any merge conflicts before approving or merging.

