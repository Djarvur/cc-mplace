---
phase: 03
slug: ci-validation-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-24
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.7 |
| **Config file** | none — uses defaults from `type: module` in package.json |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npm run format:check`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CIVAL-01 | — | AJV validates marketplace.json against official schema | unit | `npm test` | ✅ | ⬜ pending |
| 03-01-02 | 01 | 1 | CIVAL-01 | — | Prettier formatting check passes | CI | `npm run format:check` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 1 | CIVAL-02 | T-03-01 | Claude Code CLI validates with `--strict` | CI | `claude plugin validate . --strict` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | CIVAL-03 | — | `git ls-remote` confirms source repo exists | CI | source verify script | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 1 | CIVAL-03 | — | GitHub API returns `default_branch` for source repo | CI | source verify script | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 1 | CIVAL-03 | — | HTTP HEAD confirms `plugin.json` on default branch | CI | source verify script | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.github/workflows/validate.yml` — CI workflow file (directory does not exist)
- [ ] Source verification script — inline in workflow or new test file
- [ ] GitHub secret `OPENCODE_API_KEY` — manual step in repo Settings > Secrets

*Existing test infrastructure in `tests/marketplace.test.js` covers schema, uniqueness, and metadata validation for CIVAL-01.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GitHub secret `OPENCODE_API_KEY` configured | CIVAL-02 | Cannot set repo secrets via code | Go to repo Settings > Secrets and variables > Actions > New repository secret |
| Full CI pipeline runs on PR | CIVAL-01, CIVAL-02, CIVAL-03 | Requires opening actual PR or pushing to branch | Open test PR, verify all 4 steps pass in Actions tab |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 3s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
