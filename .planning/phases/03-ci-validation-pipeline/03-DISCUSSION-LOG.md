# Phase 3: CI Validation Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 3-CI Validation Pipeline
**Areas discussed:** CLI installation, CLI authentication, source repo verification, CI trigger scope, CI pipeline steps

---

## Gray Areas Selected

User selected all three initial gray areas: CLI installation, source repo verification method, CI trigger scope.

---

## CLI Installation Method

| Option | Description | Selected |
|--------|-------------|----------|
| Native installer in CI | `curl -fsSL https://claude.ai/install.sh \| bash` — no npm/Node.js dependency | ✓ |
| npm (deprecated) | `npm install -g @anthropic-ai/claude-code` — user confirmed this doesn't work with latest versions | |
| Vitest only, no CLI | Extend existing tests to cover CLI checks | |

**User's choice:** Native installer, but noted npm install doesn't work with latest Claude Code versions
**Notes:** User specifically asked about alternative install methods since npm is broken for recent versions

---

## CLI Version Pinning

| Option | Description | Selected |
|--------|-------------|----------|
| Pin version | `bash -s 2.1.142` for reproducibility | |
| Latest (auto) | Always install latest, catches new validation rules | ✓ |

**User's choice:** Latest (auto)
**Notes:** No pinning — let CI catch new validation rules as they ship

---

## CLI Strict Flag

| Option | Description | Selected |
|--------|-------------|----------|
| --strict (Recommended) | Treat warnings as errors, catches misspelled fields | ✓ |
| No --strict | Only errors fail, warnings pass | |

**User's choice:** --strict
**Notes:** Per official docs recommendation for CI pipelines

---

## CLI Authentication

| Option | Description | Selected |
|--------|-------------|----------|
| Anthropic API key | Simple, direct, $0 cost since validate uses no tokens | |
| Third-party provider (Bedrock/Vertex) | More complex setup | |
| Try without auth, fallback | CLI may require login to initialize | |

**User's choice:** Custom model provider via opencode.ai
**Notes:** User provided full settings.json config pattern with deepseek-v4-flash model, ANTHROPIC_BASE_URL pointing to opencode.ai/zen/go, and API key as GitHub secret. Also provided onboarding bypass via ~/.claude.json.

---

## Source Repo Verification Method

| Option | Description | Selected |
|--------|-------------|----------|
| git ls-remote + HTTP check | Fast (~2s/plugin), checks repo exists + plugin.json | ✓ |
| Shallow clone + file check | Most thorough, ~5-10s per plugin | |
| Full validate per plugin | Most comprehensive but slowest | |

**User's choice:** git ls-remote + HTTP check
**Notes:** Two-step: git ls-remote confirms repo, HTTP GET on raw GitHub URL confirms plugin.json

---

## Default Branch Detection

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub API for default branch | GET /repos/{owner}/{repo} → default_branch | ✓ |
| Try main/master fallback | Simpler, works 99% of repos | |

**User's choice:** GitHub API for default branch
**Notes:** Use auto-available GITHUB_TOKEN in Actions for API auth

---

## CI Trigger Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All PRs (Recommended) | Simple trigger, repo is small so CI is fast | ✓ |
| Path-filtered | Only trigger on marketplace-relevant file changes | |

**User's choice:** All PRs to main

---

## CI Pipeline Steps

| Option | Description | Selected |
|--------|-------------|----------|
| Full pipeline (Recommended) | Prettier → Vitest → Claude validate → Source check | ✓ |
| CIVAL requirements only | Only the three requirement-specified checks | |

**User's choice:** Full pipeline
**Notes:** Four steps: format check, test, Claude validate, source verification

---

## Claude's Discretion

- Exact workflow job structure (single job vs multiple jobs)
- Source verification script implementation (JS test vs shell script)
- Error messaging and output formatting

## Deferred Ideas

None — discussion stayed within phase scope.
