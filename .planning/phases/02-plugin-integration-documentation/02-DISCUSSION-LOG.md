# Phase 2: Plugin Integration & Documentation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 2-Plugin Integration & Documentation
**Areas discussed:** Plugin Entry Metadata, README scope & structure, E2E verification strategy

---

## Plugin Entry Metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Mirror plugin.json exactly | Use same description, displayName, version from plugin.json | ✓ |
| Custom marketplace description | Keep name/version from plugin.json but write marketplace-specific description | |
| You decide | Claude picks the best approach | |

**User's choice:** Mirror plugin.json exactly
**Notes:** Consistent, no drift between marketplace and plugin manifest

| Option | Description | Selected |
|--------|-------------|----------|
| https://github.com/Djarvur/cc-websearch | Full HTTPS URL | |
| Djarvur/cc-websearch | GitHub shorthand | |
| Match official format | Check official marketplace schema/format docs | ✓ |

**User's choice:** Match official format
**Notes:** Research showed official format uses `{ "source": "url", "url": "https://github.com/..." }` object structure for external plugins

| Option | Description | Selected |
|--------|-------------|----------|
| Skip SHA (Recommended) | Omit SHA. Simpler, no commit tracking. Matches v2 deferral | ✓ |
| Include SHA now | Add SHA for current commit. Matches official format exactly | |
| You decide | Claude picks | |

**User's choice:** Skip SHA — deferred to v2 (META-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Include both (Recommended) | Add author + category fields | ✓ |
| Omit both | Skip optional fields | |

**User's choice:** Include both — author: Djarvur, category: search

---

## README Scope & Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (Recommended) | Essentials only: what this is, add marketplace, install plugin. ~30-50 lines | ✓ |
| Comprehensive | Badges, plugin list table, contributing, troubleshooting. ~100-150 lines | |
| Mirror official | Match anthropics/claude-plugins-official README structure | |

**User's choice:** Minimal — essentials only

| Option | Description | Selected |
|--------|-------------|----------|
| Include plugin table (Recommended) | One-liner table (name + description). Browsable, easy to update | ✓ |
| Generic install command only | Just `claude plugin install <name>`. No maintenance | |

**User's choice:** Include plugin table

---

## E2E Verification Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Manual CLI test (Recommended) | Run actual CLI commands during development, confirm success | ✓ |
| Ship and verify later | Trust format, verify later | |
| Automated test script | Script that runs CLI commands, checks exit codes | |

**User's choice:** Manual CLI test

| Option | Description | Selected |
|--------|-------------|----------|
| Document and proceed (Recommended) | Log the bug, mark verification as blocked, proceed | ✓ |
| Block until fixed | Block Phase 2 completion until bug resolved | |

**User's choice:** Document and proceed — phase delivers entry + README regardless of platform bugs

---

## Claude's Discretion

None — all decisions made by user.

## Deferred Ideas

None — discussion stayed within phase scope.
