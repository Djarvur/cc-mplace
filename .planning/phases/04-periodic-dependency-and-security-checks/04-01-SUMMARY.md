---
phase: 04-periodic-dependency-and-security-checks
plan: 01
subsystem: ci-infra
tags: [dependabot, auto-merge, branch-protection, dependencies, security]
dependency_graph:
  requires: [validate.yml CI workflow]
  provides: [automated dependency scanning, CI-gated auto-merge]
  affects: [.github/dependabot.yml, .github/workflows/dependabot-auto-merge.yml]
tech_stack:
  added: [dependabot.yml, dependabot/fetch-metadata@v2]
  patterns: [weekly scanning, cooldown-based delay, CI-gated auto-merge]
key_files:
  created:
    - .github/dependabot.yml
    - .github/workflows/dependabot-auto-merge.yml
  modified: []
decisions:
  - D-09 relaxed to allow one auto-merge workflow (dependabot.yml has no auto-merge option)
  - Both security and version updates auto-merge after CI passes (no type filtering in workflow)
  - Cooldown in dependabot.yml handles 5-day delay for version bumps natively
  - Branch protection enforce_admins:true ensures even admin pushes require CI
metrics:
  duration: 1 min
  completed: 2026-05-24
  tasks: 2
  files: 2
---

# Phase 4 Plan 1: Dependabot Configuration Summary

Dependabot configured for weekly npm + GitHub Actions scanning with 5-day cooldown and CI-gated auto-merge via dependabot/fetch-metadata workflow.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create dependabot.yml and auto-merge workflow | aba4301 | .github/dependabot.yml, .github/workflows/dependabot-auto-merge.yml |
| 2 | Configure repository settings | (no commit - API changes) | N/A |

## What Was Built

### dependabot.yml

Two ecosystem entries:
- **npm**: Weekly Monday 05:00 UTC scans of package.json/package-lock.json. 5-day cooldown delays version bumps. Labels: dependencies, automated. Commit prefix: chore(deps)/chore(deps-dev) with scope. All dependency types scanned (D-06).
- **github-actions**: Same schedule and cooldown. Scans .github/workflows/*.yml for action version updates.

### dependabot-auto-merge.yml

GitHub Actions workflow that triggers on every pull_request. Restricted to `dependabot[bot]` actor on `Djarvur/cc-mplace` repo. Uses `dependabot/fetch-metadata@v2` to extract PR metadata, then runs `gh pr merge --auto --merge`. Auto-merge queues until required CI checks pass (branch protection gate).

### Repository Settings (via gh api)

1. **Auto-merge enabled**: `allow_auto_merge: true` set on repository
2. **Branch protection on main**: Requires `validate` status check, `enforce_admins: true`, no review or push restrictions
3. **`automated` label created**: Gray color (#ededed), description "Automated PR (Dependabot)"

## Decisions Made

1. **D-09 relaxed**: The plan acknowledged that dependabot.yml has no auto-merge option. D-04 (the functional requirement) takes priority over D-09 (implementation preference). One minimal workflow file added.
2. **No update-type filtering in auto-merge workflow**: Both security and version updates auto-merge after CI passes. The 5-day cooldown in dependabot.yml handles the delay for version bumps; security updates arrive immediately and should auto-merge immediately.
3. **enforce_admins: true**: Even admin pushes must pass CI. Consistent with the security posture for a public registry.

## Verification Results

- dependabot.yml: Valid YAML, 2 update entries, correct schedule/cooldown/labels/commit-message
- Auto-merge workflow: Valid YAML, correct permissions, actor restriction, fetch-metadata and merge steps
- Existing tests: 5/5 pass (vitest run)
- Repository auto-merge: `true` (verified via gh api)
- Branch protection: `validate` required check, `enforce_admins: true` (verified via gh api)
- `automated` label: exists (verified via gh api)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

No new threat surface beyond what the plan's threat model covers. All mitigations (actor restriction, repo restriction, branch protection, CI gating) implemented as specified.

## Self-Check: PASSED

- FOUND: .github/dependabot.yml
- FOUND: .github/workflows/dependabot-auto-merge.yml
- FOUND: aba4301 in git log
