# Phase 4: Periodic Dependency and Security Checks - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure Dependabot for automated dependency version updates and security vulnerability scanning on a weekly schedule, with auto-merge for both security fixes and routine updates when CI passes. Covers npm dependencies and GitHub Actions versions.
</domain>

<decisions>
## Implementation Decisions

### Scanning Tool

- **D-01:** Use GitHub Dependabot — native to GitHub, zero extra infrastructure, handles both security alerts and version updates
- **D-02:** Enable both security updates and version updates — keeps all 4 devDependencies current automatically
- **D-03:** Individual PRs per dependency update — no grouping. With only 4 deps this stays manageable and makes rollback easier
- **D-04:** Auto-merge Dependabot PRs when CI passes. Security fixes merge immediately; version bumps have a 5-day grace period before auto-merge

### Failure Policy

- **D-05:** Block on high + medium severity findings. Low/info are advisory only
- **D-06:** Same scanning policy for devDependencies and production dependencies — devDeps like ajv run in CI where supply chain attacks matter

### Schedule

- **D-07:** Weekly check schedule — appropriate for a 4-dependency project with infrequent updates
- **D-08:** Run on Mondays at 05:00 UTC (early morning) — PRs ready at start of week, CI load hits off-peak

### Workflow Structure

- **D-09:** Use `dependabot.yml` for scanning/scheduling/cooldown config. One auto-merge workflow file (`dependabot-auto-merge.yml`) is needed for D-04 since `dependabot.yml` has no auto-merge option. Updated per research finding.
- **D-10:** Scan two ecosystems: npm (4 devDependencies) and GitHub Actions (actions/checkout, actions/setup-node)
- **D-11:** Apply standard labels to Dependabot PRs: `dependencies` and `automated` for easy filtering

### Claude's Discretion

- Exact dependabot.yml location (`.github/dependabot.yml` is conventional)
- Commit message prefix format for Dependabot PRs
- Whether to set `open-pull-requests-limit` (default 5 is fine for 4 deps)
- Specific time within the early-morning window

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing CI Infrastructure

- `.github/workflows/validate.yml` — Current CI workflow (Prettier, Vitest, Claude Code validate, source verification). Dependabot PRs will run against this
- `package.json` — npm scripts and devDependencies (ajv, ajv-formats, prettier, vitest)

### Dependabot Configuration

- https://docs.github.com/en/code-security/dependabot/configuration-options-for-the-dependabot.yml-file — Official dependabot.yml configuration reference

### Project Context

- `.planning/REQUIREMENTS.md` — Project requirements and traceability
- `.planning/ROADMAP.md` — Phase 4 entry with goal and dependencies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `.github/workflows/validate.yml` — CI pipeline that Dependabot PRs will automatically trigger. No changes needed to existing workflow
- `package.json` — Dependency list is small and stable (4 devDeps). Dependabot config is straightforward

### Established Patterns

- GitHub Actions for CI — Phase 3 established the pattern, Dependabot extends it
- Single-file config approach — `dependabot.yml` follows the same pattern as `validate.yml` (declarative config in `.github/`)

### Integration Points

- `.github/dependabot.yml` (new) — Dependabot configuration file
- `package.json` — npm ecosystem that Dependabot scans
- `.github/workflows/validate.yml` — CI that Dependabot PRs must pass before auto-merge

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard Dependabot configuration for a small static project.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 04-periodic-dependency-and-security-checks*
*Context gathered: 2026-05-24*
