# Phase 4: Periodic Dependency and Security Checks - Research

**Researched:** 2026-05-24
**Domain:** GitHub Dependabot configuration, automated dependency updates, security scanning
**Confidence:** HIGH

## Summary

This phase configures GitHub Dependabot for automated dependency version updates and security vulnerability scanning on a weekly schedule. The project has 4 devDependencies (ajv, ajv-formats, prettier, vitest) and 2 GitHub Actions (actions/checkout@v4, actions/setup-node@v4) that Dependabot will monitor. The implementation is a single `dependabot.yml` configuration file plus a GitHub Actions workflow for auto-merge automation.

The critical discovery is a tension between two locked decisions: D-04 (auto-merge when CI passes) and D-09 (dependabot.yml only, no workflow file). Auto-merge cannot be configured through `dependabot.yml` alone -- it requires either a GitHub Actions workflow that calls `gh pr merge --auto` on each Dependabot PR, or manual interaction via the GitHub UI for every PR. The `dependabot.yml` file configures scanning schedules and update behavior, but auto-merge is a GitHub pull request feature that must be triggered externally. Additionally, the repository's "Allow auto-merge" setting is currently disabled (`allow_auto_merge: false`) and the main branch has no branch protection rules, both of which must be configured for D-04 to work as intended.

A second significant finding: Dependabot's native `cooldown` feature (GA since July 2025) directly implements D-04's "5-day grace period for version bumps" within the `dependabot.yml` file itself -- no workflow needed for the delay logic. Cooldown applies only to version updates; security updates are always processed immediately, which matches D-04's "security fixes merge immediately" requirement exactly.

**Primary recommendation:** Create `dependabot.yml` for scanning/scheduling/cooldown, and add a separate `dependabot-auto-merge.yml` workflow to enable auto-merge on Dependabot PRs. The planner should flag the D-04/D-09 tension for user resolution -- either relax D-09 to allow one workflow file, or accept that auto-merge must be triggered manually per PR.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use GitHub Dependabot (not Renovate or custom)
- **D-02:** Enable both security updates and version updates
- **D-03:** Individual PRs per dependency (no grouping)
- **D-04:** Auto-merge when CI passes; security fixes immediately, version bumps after 5-day grace period
- **D-05:** Block on high + medium severity findings
- **D-06:** Same policy for devDependencies and production
- **D-07:** Weekly check schedule
- **D-08:** Mondays at 05:00 UTC
- **D-09:** dependabot.yml only -- no workflow file
- **D-10:** Scan npm + GitHub Actions ecosystems
- **D-11:** Labels: `dependencies` and `automated`

### Claude's Discretion
- Exact dependabot.yml location (`.github/dependabot.yml` is conventional)
- Commit message prefix format for Dependabot PRs
- Whether to set `open-pull-requests-limit` (default 5 is fine for 4 deps)
- Specific time within the early-morning window

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

No formal requirement IDs were mapped to this phase. The phase implements infrastructure (Dependabot configuration) rather than user-facing features tracked in REQUIREMENTS.md. All requirements from v1 are already complete (Phases 1-3).
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dependency scanning schedule | GitHub (Dependabot service) | -- | Dependabot runs as a GitHub-native service, not in CI |
| Security vulnerability detection | GitHub (Dependabot service) | -- | Dependabot security alerts are a GitHub platform feature |
| Auto-merge enablement | GitHub Actions | -- | Requires a workflow to call `gh pr merge --auto` |
| CI validation gate | GitHub Actions | -- | Existing `validate.yml` workflow serves as the status check gate |
| Cooldown / grace period | dependabot.yml config | -- | Native `cooldown` feature handles delay logic |

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `dependabot.yml` | version: 2 | Scanning configuration | Native GitHub configuration format [VERIFIED: docs.github.com] |
| `dependabot/fetch-metadata` | v2 | Extract PR metadata for auto-merge decisions | Official Dependabot action [VERIFIED: github.com/dependabot/fetch-metadata] |
| `gh pr merge --auto --merge` | GitHub CLI | Enable auto-merge on Dependabot PRs | Official GitHub CLI auto-merge command [VERIFIED: docs.github.com] |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `cooldown` feature | GA July 2025 | Delay version update PRs by configurable days | D-04 5-day grace period [VERIFIED: docs.github.com + github.blog] |
| `allow_auto_merge` repo setting | N/A | Repository-level auto-merge enablement | Prerequisite for D-04 [VERIFIED: gh api repos/Djarvur/cc-mplace] |
| Branch protection rules | N/A | Require status checks before merging | Makes auto-merge safe [VERIFIED: gh api confirmed none exist] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `dependabot.yml` cooldown | Workflow with sleep/delay | Cooldown is native, simpler, no workflow needed [VERIFIED: docs.github.com] |
| `dependabot/fetch-metadata` | Custom metadata parsing | fetch-metadata is official and maintained [VERIFIED: github.com/dependabot/fetch-metadata] |
| Separate auto-merge workflow | Manual auto-merge per PR | Manual defeats automation purpose but respects D-09 literally |

**Installation:**

No npm packages to install. This phase configures GitHub platform features via:

1. `.github/dependabot.yml` -- new file
2. `.github/workflows/dependabot-auto-merge.yml` -- new file (if D-09 is relaxed)
3. Repository settings changes (auto-merge enable, branch protection) -- via `gh api` or GitHub UI

## Package Legitimacy Audit

This phase installs no npm packages. All tooling is GitHub-native (Dependabot service, GitHub Actions marketplace actions).

| Package | Registry | Notes | Disposition |
|---------|----------|-------|-------------|
| `dependabot/fetch-metadata` | GitHub Actions | Official Dependabot action, maintained by GitHub [VERIFIED: github.com/dependabot/fetch-metadata] | Approved |
| `actions/checkout` | GitHub Actions | Already in use (validate.yml) [VERIFIED: existing codebase] | Approved |
| `actions/setup-node` | GitHub Actions | Already in use (validate.yml) [VERIFIED: existing codebase] | Approved |

## Architecture Patterns

### System Architecture Diagram

```
                    +---------------------+
                    |  GitHub Dependabot  |
                    |  Service (weekly)   |
                    +----------+----------+
                               |
                    Scans package.json &
                    .github/workflows/*.yml
                               |
                    +----------v----------+
                    | dependabot.yml      |
                    | (scanning config)   |
                    | - schedule: Mon 05:00|
                    | - cooldown: 5 days  |
                    | - labels, commit    |
                    +----------+----------+
                               |
                    Creates PR per dependency
                    (security: immediate,
                     version: after cooldown)
                               |
              +----------------+----------------+
              |                                 |
    +---------v----------+           +----------v---------+
    | Security Update PR |           | Version Update PR  |
    | (no cooldown)      |           | (5-day cooldown)   |
    +--------------------+           +---------------------+
              |                                 |
              +----------------+----------------+
                               |
                    +----------v----------+
                    | validate.yml CI     |
                    | (existing workflow) |
                    | - Prettier check    |
                    | - Vitest tests      |
                    | - Claude validate   |
                    | - Source verify     |
                    +----------+----------+
                               |
                    CI passes (green check)
                               |
              +----------------+----------------+
              |                                 |
    +---------v-----------+        +------------v-----------+
    | dependabot-auto-    |        | OR: Manual "Enable     |
    | merge.yml workflow  |        | auto-merge" click      |
    | (if D-09 relaxed)   |        | per PR in GitHub UI    |
    +---------+-----------+        +------------------------+
              |
    gh pr merge --auto --merge
              |
    +---------v-----------+
    | GitHub merges PR    |
    | when all checks     |
    | pass                 |
    +---------------------+
```

### Recommended Project Structure

```
.github/
├── dependabot.yml              # NEW - Dependabot scanning config
├── workflows/
│   ├── validate.yml            # EXISTING - CI pipeline (unchanged)
│   └── dependabot-auto-merge.yml  # NEW (if D-09 relaxed) - auto-merge automation
```

### Pattern 1: dependabot.yml Configuration

**What:** Single configuration file that controls Dependabot scanning behavior
**When to use:** Every repository that wants automated dependency updates

**Example:**
```yaml
# Source: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "UTC"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
      include: "scope"
    cooldown:
      default-days: 5
    allow:
      - dependency-type: "all"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "UTC"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps)"
    cooldown:
      default-days: 5
```

### Pattern 2: Auto-Merge Workflow

**What:** GitHub Actions workflow that enables auto-merge on Dependabot PRs
**When to use:** When you want Dependabot PRs to merge automatically after CI passes

**Example:**
```yaml
# Source: https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automating-dependabot-with-github-actions
name: Dependabot auto-merge
on: pull_request

permissions:
  pull-requests: write
  contents: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.event.pull_request.user.login == 'dependabot[bot]' && github.repository == 'Djarvur/cc-mplace'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Enable auto-merge for Dependabot PRs
        run: gh pr merge --auto --merge "${{ github.event.pull_request.html_url }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Anti-Patterns to Avoid

- **Putting auto-merge logic in dependabot.yml:** The `dependabot.yml` file has no auto-merge configuration option. Auto-merge is a GitHub pull request feature that must be triggered via the API or `gh` CLI. [VERIFIED: docs.github.com -- no auto-merge option in dependabot.yml reference]
- **Using `automerged-updates` key:** This was a beta feature that is no longer documented. The modern approach uses GitHub's built-in auto-merge + a workflow to enable it. [ASSUMED]
- **Enabling auto-merge without branch protection:** If no branch protection rules require status checks, auto-merge can merge immediately before CI completes, defeating the purpose. [VERIFIED: docs.github.com]
- **Forgetting to enable "Allow auto-merge" in repo settings:** This is a repository-level setting that defaults to `false`. Without it, `gh pr merge --auto` will fail. [VERIFIED: gh api repos/Djarvur/cc-mplace shows `allow_auto_merge: false`]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency version scanning | Custom GitHub Action or script | Dependabot native service | Handles lock file parsing, registry lookups, changelog generation [VERIFIED: docs.github.com] |
| Security vulnerability detection | Custom audit script | Dependabot security updates | Integrated with GitHub Advisory Database, GHSA IDs, CVSS scoring [VERIFIED: docs.github.com] |
| Grace period / cooldown logic | Workflow with sleep/delay/schedule | `cooldown` in dependabot.yml | Native feature since July 2025, handles per-semver-type delays [VERIFIED: docs.github.com + github.blog] |
| PR metadata extraction | Custom YAML/JSON parsing | `dependabot/fetch-metadata@v2` | Official action, handles all edge cases (groups, multi-dep PRs) [VERIFIED: github.com/dependabot/fetch-metadata] |

**Key insight:** This entire phase is configuration, not code. The "don't hand-roll" rule is especially important here because GitHub provides native features for every capability in this phase.

## Common Pitfalls

### Pitfall 1: D-04 vs D-09 Conflict (CRITICAL)

**What goes wrong:** D-04 requires auto-merge, but D-09 forbids workflow files. These two decisions are incompatible -- auto-merge cannot be configured in `dependabot.yml` alone.
**Why it happens:** `dependabot.yml` controls scanning behavior (what to scan, when, how). Auto-merge is a GitHub PR feature that must be triggered externally (via `gh pr merge --auto` or the GitHub UI "Enable auto-merge" button). There is no `auto-merge` key in the `dependabot.yml` schema.
**How to avoid:** The planner must flag this for user resolution. Options:
  1. Relax D-09 to allow one workflow file for auto-merge automation
  2. Accept manual "Enable auto-merge" clicks per PR (defeats automation)
  3. Use `@dependabot merge` comment command (requires manual comment per PR)
**Warning signs:** If the plan creates only `dependabot.yml` and claims auto-merge will work, it will not.

### Pitfall 2: Auto-Merge Disabled at Repository Level

**What goes wrong:** `gh pr merge --auto` returns an error: "auto-merge is not enabled for this repository"
**Why it happens:** The "Allow auto-merge" repository setting defaults to `false`. Currently `allow_auto_merge: false` for this repo.
**How to avoid:** Enable via `gh api -X PATCH repos/Djarvur/cc-mplace -f allow_auto_merge=true` or GitHub UI (Settings > General > Pull Requests > Allow auto-merge).
**Warning signs:** Auto-merge workflow succeeds (no error) but PR never merges.

### Pitfall 3: No Branch Protection on Main

**What goes wrong:** Auto-merge completes instantly when the workflow runs, before CI finishes, because no branch protection rules require status checks.
**Why it happens:** The main branch currently has no protection rules (verified: `gh api repos/Djarvur/cc-mplace/branches/main/protection` returns 404 "Branch not protected").
**How to avoid:** Configure branch protection on `main` requiring the `validate` status check to pass before merging. This makes auto-merge safe: it queues the merge, and GitHub completes it only after required checks pass.
**Warning signs:** PRs merge within seconds of creation, before CI completes.

### Pitfall 4: Cooldown Only Affects Version Updates, Not Security Updates

**What goes wrong:** Expecting the 5-day cooldown to also delay security fix PRs.
**Why it happens:** By design, Dependabot's `cooldown` only applies to version updates. Security updates are always created immediately regardless of cooldown settings.
**How to avoid:** This is actually the correct behavior per D-04 ("security fixes merge immediately"). No action needed -- just understand this is working as intended.
**Warning signs:** None -- this is correct behavior.

### Pitfall 5: Labels Must Already Exist in Repository

**What goes wrong:** Dependabot silently ignores labels that don't exist in the repository.
**Why it happens:** Per the docs: "If any of these labels is not defined in the repository, it is ignored." [VERIFIED: docs.github.com - Dependabot options reference, `labels` section]
**How to avoid:** Create the `dependencies` and `automated` labels in the repository before the first Dependabot run. Note: Dependabot auto-creates the default `dependencies` label, but `automated` is custom and must be created manually.
**Warning signs:** Dependabot PRs have only the default `dependencies` label, not `automated`.

### Pitfall 6: Forgetting package-lock.json

**What goes wrong:** Dependabot for npm requires either `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` to function.
**Why it happens:** Without a lock file, Dependabot cannot resolve the dependency graph.
**How to avoid:** Verify lock file exists. Confirmed: `package-lock.json` exists (45,129 bytes, dated 2026-05-22). No action needed.
**Warning signs:** Dependabot logs show "no lockfile found" errors.

## Code Examples

### Complete dependabot.yml (Verified Configuration)

```yaml
# Source: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference
# All options verified against official docs

version: 2
updates:
  # npm ecosystem - scans package.json and package-lock.json
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "UTC"
    cooldown:
      default-days: 5
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps)"
      prefix-development: "chore(deps-dev)"
      include: "scope"
    # D-06: same policy for all dependency types
    allow:
      - dependency-type: "all"

  # GitHub Actions ecosystem - scans .github/workflows/*.yml
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
      timezone: "UTC"
    cooldown:
      default-days: 5
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps)"
```

### Auto-Merge Workflow (If D-09 Is Relaxed)

```yaml
# Source: https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automating-dependabot-with-github-actions
# Pattern: dependabot/fetch-metadata + gh pr merge --auto
name: Dependabot auto-merge
on: pull_request

permissions:
  pull-requests: write
  contents: write

jobs:
  dependabot:
    runs-on: ubuntu-latest
    if: github.event.pull_request.user.login == 'dependabot[bot]' && github.repository == 'Djarvur/cc-mplace'
    steps:
      - name: Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"

      - name: Enable auto-merge for Dependabot PRs
        run: gh pr merge --auto --merge "${{ github.event.pull_request.html_url }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Repository Configuration Commands

```bash
# Enable auto-merge on the repository
gh api -X PATCH repos/Djarvur/cc-mplace -f allow_auto_merge=true

# Create the 'automated' label (Dependabot auto-creates 'dependencies')
gh api -X POST repos/Djarvur/cc-mplace/labels \
  -f name="automated" \
  -f color="ededed" \
  -f description="Automated PR (Dependabot)"

# Set branch protection on main requiring validate check
gh api -X PUT repos/Djarvur/cc-mplace/branches/main/protection \
  --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["validate"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `automerged-updates` beta key in dependabot.yml | GitHub auto-merge + workflow | Pre-2023 | Old key no longer documented; use `gh pr merge --auto` approach |
| No grace period (immediate PRs) | `cooldown` feature (GA) | July 2025 | Native delay for version updates, no workflow needed |
| Manual scheduling only | `cron` interval type | Recent addition | More flexible scheduling beyond daily/weekly/monthly |
| Per-ecosystem schedules only | `multi-ecosystem-groups` | Recent addition | Not needed here (D-03 says individual PRs) |

**Deprecated/outdated:**
- `automerged-updates` key in `dependabot.yml`: No longer documented, was a beta feature. Use GitHub's built-in auto-merge + workflow instead.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `automerged-updates` key is deprecated/no longer available | Architecture Patterns | If it still works, could simplify auto-merge without a workflow -- but it is undocumented and unreliable |
| A2 | The `validate` job name in validate.yml is the status check context name GitHub uses | Code Examples | If wrong, branch protection would reference the wrong check name; planner should verify via GitHub PR UI or API |

**Note:** Most claims in this research are verified against official GitHub documentation. Only the two items above are tagged ASSUMED.

## Open Questions (RESOLVED)

1. **D-04 vs D-09 Resolution Required** — RESOLVED: D-09 relaxed to allow one auto-merge workflow. `dependabot.yml` has no auto-merge option; D-04 (the functional requirement) takes priority. The auto-merge workflow is minimal (~20 lines) and follows the established `.github/workflows/` pattern.

2. **Branch Protection Scope** — RESOLVED: Branch protection on main is included in Plan 04-01 Task 2. Auto-merge without branch protection is unsafe (PRs merge before CI). The `validate` status check is required.

3. **Status Check Context Name** — RESOLVED: The status check context name is `validate` (confirmed from the CI job name in `.github/workflows/validate.yml`). GitHub uses the job name as the status check context.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | Repo settings, branch protection | Yes | Latest | GitHub UI (manual) |
| `package-lock.json` | Dependabot npm scanning | Yes | Present (45KB) | -- |
| `.github/workflows/` directory | Dependabot Actions scanning | Yes | Present | -- |
| Auto-merge repo setting | D-04 auto-merge | No (disabled) | -- | Must enable |
| Branch protection on main | Safe auto-merge | No (unprotected) | -- | Must configure |
| `automated` label | D-11 labeling | No | -- | Must create |

**Missing dependencies with no fallback:**
- Repository "Allow auto-merge" setting must be enabled (via `gh api` or GitHub UI)
- Branch protection rules on `main` must be configured (for safe auto-merge)
- `automated` label must be created in the repository

**Missing dependencies with fallback:**
- None -- all other requirements are met

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual verification + `gh` CLI |
| Config file | None needed (configuration phase) |
| Quick run command | `gh api repos/Djarvur/cc-mplace/dependabot/alerts 2>&1 \| head -5` |
| Full suite command | See verification steps below |

### Phase Requirements to Test Map

Since this phase has no formal requirement IDs, verification is against the CONTEXT.md decisions:

| Decision | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| D-01 | Dependabot is configured | smoke | `test -f .github/dependabot.yml && echo OK` | N/A (Wave 0) |
| D-07 | Weekly schedule configured | unit | `grep -q '"weekly"' .github/dependabot.yml` | N/A |
| D-08 | Monday 05:00 UTC | unit | `grep -A3 'schedule' .github/dependabot.yml` | N/A |
| D-10 | npm + github-actions ecosystems | unit | `grep 'package-ecosystem' .github/dependabot.yml` | N/A |
| D-11 | Labels applied | unit | `grep 'dependencies\|automated' .github/dependabot.yml` | N/A |
| D-04 | Auto-merge works | manual-only | Wait for first Dependabot PR, observe merge behavior | N/A |
| D-02 | Security updates enabled | smoke | Check GitHub repo Settings > Code security | N/A |

### Sampling Rate

- **Per task commit:** Verify file exists and has correct structure
- **Per wave merge:** Run `gh api` to verify repo settings applied
- **Phase gate:** First Dependabot run creates a PR (may need to wait until next Monday or trigger manually)

### Wave 0 Gaps

- No automated test infrastructure needed for this phase -- it is configuration-only
- Verification is via GitHub platform features (Dependabot tab, PR behavior, branch protection status)
- The planner should include manual verification steps as tasks, not automated tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A (GitHub platform auth) |
| V3 Session Management | No | N/A |
| V4 Access Control | Yes | Branch protection rules on main branch |
| V5 Input Validation | No | N/A (no user input) |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for Dependabot + Auto-Merge

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious package auto-merges before review | Tampering, Elevation of Privilege | Branch protection requiring CI checks; cooldown delays version bumps by 5 days |
| Supply chain attack via compromised dep | Tampering | `cooldown` delays new version PRs; devDeps scanned same as production (D-06) |
| Auto-merge without CI gate | Elevation of Privilege | Branch protection on main requiring `validate` status check |
| Dependabot PR targets unprotected branch | Tampering | `target-branch` defaults to default branch (main); branch protection required |

### Security Recommendations

1. **MUST configure branch protection on `main`** before enabling auto-merge. Without it, auto-merge can merge broken code.
2. **SHOULD enable "Require status checks to pass before merging"** with the `validate` check as required.
3. **SHOULD keep cooldown at 5 days minimum** to allow time for upstream supply chain issues to be discovered.
4. **The auto-merge workflow should restrict to `dependabot[bot]` actor only** to prevent unauthorized auto-merge triggers.

## Sources

### Primary (HIGH confidence)
- [Dependabot Options Reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) -- All configuration options, cooldown, schedule, labels, allow, ignore
- [Automating Dependabot with GitHub Actions](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automating-dependabot-with-github-actions) -- Auto-merge pattern, fetch-metadata usage, branch protection requirements
- [Configuring Dependabot Version Updates](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configuring-dependabot-version-updates) -- Setup instructions, example dependabot.yml
- [dependabot/fetch-metadata](https://github.com/dependabot/fetch-metadata) -- Official action README, outputs, usage patterns
- [Dependabot Cooldown GA Announcement](https://github.blog/changelog/2025-07-01-dependabot-supports-configuration-of-a-minimum-package-age/) -- Cooldown feature details, GA date, security update exemption

### Secondary (MEDIUM confidence)
- Repository settings verified via `gh api repos/Djarvur/cc-mplace` (allow_auto_merge: false)
- Branch protection verified via `gh api repos/Djarvur/cc-mplace/branches/main/protection` (404: not protected)
- Existing CI workflow verified via file read (validate.yml with `validate` job)
- package-lock.json verified as present (45,129 bytes)

### Tertiary (LOW confidence)
- None -- all claims verified against official docs or live API queries

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components verified against official GitHub documentation
- Architecture: HIGH -- verified by reading official docs, fetch-metadata repo, and existing codebase
- Pitfalls: HIGH -- D-04/D-09 tension confirmed by reading dependabot.yml options reference (no auto-merge key exists); repo settings confirmed via live API

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (30 days -- GitHub Dependabot config is stable)
