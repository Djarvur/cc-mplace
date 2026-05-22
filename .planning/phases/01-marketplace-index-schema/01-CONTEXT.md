# Phase 1: Marketplace Index & Schema - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

## Phase Boundary

Create a structurally valid marketplace.json at `.claude-plugin/marketplace.json` with correct schema, plugin entry format, and uniqueness enforcement via a local validation script. Ship with empty plugins array — Phase 2 adds the first real plugin.

## Implementation Decisions

### Marketplace Identity

- **D-01:** Marketplace name = `Djarvur Plugin Marketplace` — clear, descriptive, matches repo name
- **D-02:** Owner field = `Djarvur` — matches GitHub org, standard convention
- **D-03:** Description = `Curated plugins for Claude Code` — generic, covers any plugin type

### Uniqueness Enforcement

- **D-04:** Local validation script using AJV against the official Claude Code marketplace JSON Schema. Validates schema conformance + checks for duplicate plugin names
- **D-05:** Validation scope = schema + uniqueness only. No source repo reachability checks in Phase 1 (Phase 3 CI handles that)
- **D-06:** Validation written as a Vitest test file — familiar pattern, easy to extend for Phase 3 CI

### Initial Plugins State

- **D-07:** Ship with empty `plugins: []` array. Phase 2 adds cc-websearch as the first entry

### Supporting Files

- **D-08:** Phase 1 delivers: marketplace.json + validation test + package.json (for AJV/Vitest deps) + .prettierrc + .gitignore updates. Minimal infra that sets up Phase 3 CI foundation

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Official Claude Code Marketplace Format

- https://code.claude.com/docs/en/plugin-marketplaces — Official marketplace specification, JSON format, CLI commands
- https://code.claude.com/docs/en/plugins-reference — Plugin manifest format (plugin.json), structure, fields
- https://github.com/anthropics/claude-plugins-official — Reference implementation of an official plugin marketplace (compare structure and patterns)

### Project Context

- `CLAUDE.md` — Stack choices (AJV 8.20.0, Vitest 4.1.7, Prettier 3.x), constraints, rejected alternatives
- `.planning/REQUIREMENTS.md` — MIDX-01, MIDX-02, MIDX-03 requirements for this phase
- `.planning/PROJECT.md` — Context section: cc-websearch manifest structure, static registry architecture

## Existing Code Insights

### Reusable Assets

- None — greenfield project. Phase 1 creates the first files.

### Established Patterns

- None yet. Patterns established here (validation approach, file structure) become conventions for later phases.

### Integration Points

- `.claude-plugin/marketplace.json` — the core deliverable. Phase 2 adds plugin entries; Phase 3 adds CI that runs the validation test

## Specific Ideas

No specific requirements — follow official Claude Code marketplace format exactly.

## Deferred Ideas

None — discussion stayed within phase scope.

---

_Phase: 1-Marketplace Index & Schema_
_Context gathered: 2026-05-22_
