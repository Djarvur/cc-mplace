---
phase: "04"
slug: periodic-dependency-and-security-checks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-24
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing) |
| **Config file** | `vitest.config.js` (existing) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx prettier --check .` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run && npx prettier --check .`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | D-01–D-11 | — | Dependabot config valid | manual | `grep -c .github/dependabot.yml` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | D-04 | — | Auto-merge workflow triggers on Dependabot PRs | manual | `grep -c .github/workflows/dependabot-auto-merge.yml` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This phase creates YAML configuration files, not executable code.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dependabot config accepted by GitHub | D-01–D-11 | GitHub must parse and accept the config file | Merge to main, check Settings → Code security for active Dependabot |
| Auto-merge workflow triggers on Dependabot PRs | D-04 | Requires real PR from Dependabot | Wait for first Dependabot PR, verify auto-merge is enabled |
| Repo settings configured correctly | D-04 | Requires GitHub API/Settings access | Check repo settings: allow_auto_merge=true, branch protection on main |

---

## Validation Sign-Off

- [ ] All tasks have verification path (manual for config files)
- [ ] Sampling continuity: vitest run after each commit
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
