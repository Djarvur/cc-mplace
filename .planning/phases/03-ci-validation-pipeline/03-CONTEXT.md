# Phase 3: CI Validation Pipeline - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

## Phase Boundary

Add GitHub Actions CI that validates the marketplace on every PR: schema conformance via existing Vitest tests + `claude plugin validate .` official CLI + source repo reachability checks. Full quality pipeline: Prettier formatting, Vitest tests, Claude validation, source verification.

## Implementation Decisions

### Claude Code CLI Installation

- **D-01:** Install Claude Code via native installer: `curl -fsSL https://claude.ai/install.sh | bash` — no npm, no Node.js dependency
- **D-02:** Use latest version (no version pinning) — catches new validation rules automatically
- **D-03:** Run `claude plugin validate . --strict` — treats warnings as errors per official docs recommendation for CI

### CLI Authentication in CI

- **D-04:** Configure Claude Code with custom model provider via `~/.claude/settings.json` created in CI workflow step
- **D-05:** Model: `deepseek-v4-flash` via base URL `https://opencode.ai/zen/go`
- **D-06:** API key stored as GitHub Actions secret, injected via env var
- **D-07:** Bypass onboarding with `~/.claude.json` containing `{"hasCompletedOnboarding": true}`
- **D-08:** Full CI settings.json config:
  ```json
  {
    "env": {
      "ANTHROPIC_API_KEY": "${{ secrets.OPENCODE_API_KEY }}",
      "ANTHROPIC_BASE_URL": "https://opencode.ai/zen/go",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-flash",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-flash",
      "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
      "DISABLE_TELEMETRY": "true",
      "DISABLE_COST_WARNINGS": "true",
      "CLAUDE_CODE_USE_BEDROCK": "",
      "API_TIMEOUT_MS": "3000000"
    },
    "model": "deepseek-v4-flash"
  }
  ```

### Source Repo Verification (CIVAL-03)

- **D-09:** Two-step verification per plugin: (1) `git ls-remote <source.url>` confirms repo exists, (2) HTTP GET to raw GitHub URL confirms plugin.json manifest exists
- **D-10:** Use GitHub API (`GET /repos/{owner}/{repo}` → `default_branch`) to determine correct branch for plugin.json URL construction
- **D-11:** Use auto-available `GITHUB_TOKEN` in Actions for GitHub API auth — avoids rate limit issues (1000 req/hr vs 60 unauthenticated)

### CI Workflow Structure

- **D-12:** Run on all PRs targeting main — no path filtering. Repo is small, CI is fast
- **D-13:** Four-step pipeline: (1) Prettier format check (2) Vitest tests (3) Claude Code validate (4) Source repo verification
- **D-14:** Prettier check runs `npm run format:check` — existing script, no new config needed
- **D-15:** Vitest runs `npm test` — existing script, validates schema + uniqueness + metadata

### Claude's Discretion

- Exact workflow job structure (single job vs multiple jobs)
- Source verification script implementation language (JS via Vitest test or shell script in workflow)
- Error messaging and output formatting in CI

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Official Claude Code Documentation

- https://code.claude.com/docs/en/install — Native installer commands, version pinning syntax
- https://code.claude.com/docs/en/plugins-reference — `claude plugin validate` command docs, `--strict` flag behavior, CLI commands reference
- https://code.claude.com/docs/en/plugin-marketplaces — Marketplace format specification

### Existing Codebase

- `tests/marketplace.test.js` — Existing Vitest tests: AJV schema validation, uniqueness checks, cc-websearch metadata
- `tests/schemas/marketplace.schema.json` — Official marketplace JSON Schema (local copy)
- `.claude-plugin/marketplace.json` — Current marketplace index with cc-websearch entry
- `package.json` — npm scripts: `test`, `format`, `format:check`; devDependencies: ajv, vitest, prettier

### Project Context

- `.planning/REQUIREMENTS.md` — CIVAL-01, CIVAL-02, CIVAL-03 requirements for this phase
- `.planning/PROJECT.md` — Stack choices (AJV, Vitest, Prettier), constraints, rejected alternatives
- `CLAUDE.md` — CLI validator reference (`claude plugin validate .`), what it checks (schema + duplicate names + path traversal)

## Existing Code Insights

### Reusable Assets

- `tests/marketplace.test.js` — Schema + uniqueness + metadata validation already working. CI just needs `npm install` + `npm test`
- `package.json` scripts — `test`, `format`, `format:check` already defined. CI reuses them directly
- `.prettierrc` — Formatting rules already configured

### Established Patterns

- AJV validation against official JSON Schema — Phase 1 established, continues in CI
- Vitest for testing — consistent with existing infrastructure
- Prettier for JSON formatting — configured, just needs CI enforcement

### Integration Points

- `.github/workflows/validate.yml` (new) — CI workflow file to create
- `~/.claude/settings.json` (CI-only) — Claude Code config for non-Anthropic model provider
- `~/.claude.json` (CI-only) — Onboarding bypass
- Source verification script (new) — either separate JS file or inline workflow step

## Specific Ideas

No specific requirements — follow standard GitHub Actions patterns and official Claude Code CLI docs.

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 3-CI Validation Pipeline*
*Context gathered: 2026-05-24*
