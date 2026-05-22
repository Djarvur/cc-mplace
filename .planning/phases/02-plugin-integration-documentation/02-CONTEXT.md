# Phase 2: Plugin Integration & Documentation - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

## Phase Boundary

Add cc-websearch as the first plugin entry to marketplace.json, write README.md documenting how to use the marketplace, and verify the end-to-end CLI flow works (`claude plugin marketplace add` + `claude plugin install cc-websearch`).

## Implementation Decisions

### Plugin Entry Metadata
- **D-01:** Mirror cc-websearch's plugin.json values exactly — name, description come from the plugin's own manifest
- **D-02:** Source field uses official marketplace format: `{ "source": "url", "url": "https://github.com/Djarvur/cc-websearch.git" }` — no local path, no shorthand
- **D-03:** Skip SHA pinning — deferred to v2 (META-01). Source entry includes `source` and `url` only
- **D-04:** Include optional `author: { "name": "Djarvur" }` and `category: "search"` fields — matches official marketplace pattern

### README Scope & Structure
- **D-05:** Minimal README (~30-50 lines) — essentials only: what this is, how to add marketplace, how to install plugins
- **D-06:** Include a plugin table (name + description) — lets users browse before installing

### E2E Verification Strategy
- **D-07:** Manually run `claude plugin marketplace add Djarvur/cc-mplace` and `claude plugin install cc-websearch` during development to verify the flow works
- **D-08:** If CLI flow fails due to a Claude Code bug (e.g., #38670), document the exact error and proceed — phase still delivers marketplace entry + README. Bug is a platform issue, not a marketplace issue

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Official Claude Code Marketplace Format
- https://github.com/anthropics/claude-plugins-official — Reference implementation of official marketplace (source format, entry structure, field conventions)
- https://code.claude.com/docs/en/plugin-marketplaces — Official marketplace specification, JSON format, CLI commands
- https://code.claude.com/docs/en/plugins-reference — Plugin manifest format (plugin.json), structure, fields

### Plugin Source
- `/Users/nil/DiskD/W/Djarvur/cc-websearch/.claude-plugin/plugin.json` — cc-websearch plugin manifest (local copy, verify version/description match)

### Project Context
- `CLAUDE.md` — Stack choices, constraints, rejected alternatives
- `.planning/REQUIREMENTS.md` — PLUG-01, PLUG-02, MIDX-04, DOCS-01 requirements
- `.planning/PROJECT.md` — Context section: cc-websearch manifest structure, static registry architecture

### Existing Codebase
- `.claude-plugin/marketplace.json` — Current marketplace index (empty plugins array from Phase 1)
- `tests/marketplace.test.js` — Existing validation tests (schema + uniqueness checks from Phase 1)

## Existing Code Insights

### Reusable Assets
- `tests/marketplace.test.js` — Validation tests already check schema conformance and plugin name uniqueness. Adding a plugin entry will be validated by existing tests automatically
- `.claude-plugin/marketplace.json` — Structure already established; just need to add entry to `plugins` array

### Established Patterns
- AJV validation against official JSON Schema — established in Phase 1, continues to validate new entries
- Vitest for testing — consistent with existing test infrastructure

### Integration Points
- `.claude-plugin/marketplace.json` `plugins` array — where the cc-websearch entry gets added
- README.md — new file, no existing integration point

## Specific Ideas

No specific requirements — follow official Claude Code marketplace format exactly, mirror plugin.json metadata.

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 2-Plugin Integration & Documentation*
*Context gathered: 2026-05-22*
