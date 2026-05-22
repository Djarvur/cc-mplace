# Phase 1: Marketplace Index & Schema - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 1-Marketplace Index & Schema
**Areas discussed:** Marketplace identity, Uniqueness enforcement, Initial plugins state, Supporting files

---

## Marketplace Identity

| Option                     | Description                                     | Selected |
| -------------------------- | ----------------------------------------------- | -------- |
| Djarvur Plugin Marketplace | Clear, descriptive, matches repo name           | ✓        |
| Djarvur Plugins            | Shorter, less descriptive                       |          |
| Claude Code Plugins        | Links to Claude Code brand but implies official |          |

| Option  | Description                             | Selected |
| ------- | --------------------------------------- | -------- |
| Djarvur | Matches GitHub org, standard convention | ✓        |
| Custom  | Personal handle                         |          |

| Option                                              | Description                     | Selected |
| --------------------------------------------------- | ------------------------------- | -------- |
| Curated plugins for Claude Code                     | Generic, covers any plugin type | ✓        |
| Official Djarvur plugin marketplace for Claude Code | More branded                    |          |
| Community plugins for Claude Code CLI               | Short, factual                  |          |

**User's choice:** Djarvur Plugin Marketplace / Djarvur / Curated plugins for Claude Code
**Notes:** Clean, descriptive identity matching GitHub org convention.

---

## Uniqueness Enforcement

| Option                       | Description                                                           | Selected |
| ---------------------------- | --------------------------------------------------------------------- | -------- |
| JSON Schema with uniqueItems | Schema-level enforcement only                                         |          |
| Local validation script      | Node script validates schema + duplicates, doubles as Phase 3 CI step | ✓        |
| Defer to Phase 3             | No enforcement in Phase 1, manual review only                         |          |

| Option                             | Description                                                | Selected |
| ---------------------------------- | ---------------------------------------------------------- | -------- |
| Schema + uniqueness only           | Minimal, enough to catch errors before commit              | ✓        |
| Schema + uniqueness + source check | Also verify plugin source repos — more thorough but slower |          |

| Option                | Description                                      | Selected |
| --------------------- | ------------------------------------------------ | -------- |
| AJV + official schema | Validates against Claude Code's published schema | ✓        |
| Custom JSON Schema    | Less coupled to Claude Code schema version       |          |

**User's choice:** Local validation script, schema + uniqueness only, AJV + official schema
**Notes:** Validation written as Vitest test. Script serves as foundation for Phase 3 CI.

---

## Initial Plugins State

| Option                   | Description                                              | Selected |
| ------------------------ | -------------------------------------------------------- | -------- |
| Empty plugins array      | Clean schema-only delivery, Phase 2 adds cc-websearch    | ✓        |
| Placeholder plugin entry | Proves schema works end-to-end, gets replaced in Phase 2 |          |

**User's choice:** Empty plugins array
**Notes:** Phase 1 is schema only. No content until Phase 2.

---

## Supporting Files

| Option                | Description                                                                | Selected |
| --------------------- | -------------------------------------------------------------------------- | -------- |
| Minimal infra         | marketplace.json + validate test + package.json + .prettierrc + .gitignore | ✓        |
| Marketplace.json only | Strictest Phase 1 scope                                                    |          |

| Option            | Description                                    | Selected |
| ----------------- | ---------------------------------------------- | -------- |
| Vitest test file  | Matches CLAUDE.md stack, easy to extend for CI | ✓        |
| Plain Node script | No test framework overhead                     |          |

**User's choice:** Minimal infra with Vitest test file
**Notes:** Package.json needed for AJV/Vitest deps. Sets up Phase 3 CI foundation.

---

## Claude's Discretion

None — user made all decisions explicitly.

## Deferred Ideas

None — discussion stayed within phase scope.
