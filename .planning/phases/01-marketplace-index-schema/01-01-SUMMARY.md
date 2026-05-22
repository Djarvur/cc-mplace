---
phase: 01-marketplace-index-schema
plan: 01
subsystem: testing
tags: [ajv, vitest, prettier, json-schema, marketplace-validation]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - ".claude-plugin/marketplace.json — structurally valid empty marketplace index"
  - "tests/marketplace.test.js — AJV schema validation + uniqueness enforcement"
  - "tests/schemas/marketplace.schema.json — local copy of official JSON Schema"
  - "Project scaffold (package.json, .prettierrc, .gitignore)"
affects: [02-plugin-entries, 03-ci-pipeline]

# Tech tracking
tech-stack:
  added: [ajv@8.20.0, ajv-formats@3.0.1, vitest@4.1.7, prettier@3.8.3]
  patterns: [tdd-red-green-cycle, ajv-schema-validation, local-schema-copy]

key-files:
  created:
    - .claude-plugin/marketplace.json
    - tests/marketplace.test.js
    - tests/schemas/marketplace.schema.json
    - package.json
    - package-lock.json
    - .prettierrc
    - .gitignore
  modified: []

key-decisions:
  - "Used json.schemastore.org URL for $schema field instead of anthropic.com URL (404) per RESEARCH.md Pitfall 1"
  - "Added ajv-formats dependency to support uri format in official schema"
  - "Kebab-case name field (djarvur-plugin-marketplace) per schema requirement, display name in description"

patterns-established:
  - "TDD workflow: write failing tests first (RED), then implement to pass (GREEN)"
  - "Schema validation: local schema copy in tests/schemas/ for deterministic validation"
  - "Path resolution: import.meta.url + fileURLToPath for ESM-compatible test file paths"
  - "Uniqueness enforcement: custom check beyond schema since JSON Schema does not enforce it"

requirements-completed: [MIDX-01, MIDX-02, MIDX-03]

# Metrics
duration: 4min
completed: 2026-05-22
---

# Phase 1 Plan 01: Marketplace Index & Schema Summary

**Valid empty marketplace.json at .claude-plugin/marketplace.json with AJV schema validation, uniqueness enforcement, and Vitest test suite covering MIDX-01/02/03**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-22T11:16:32Z
- **Completed:** 2026-05-22T11:20:59Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created structurally valid marketplace.json conforming to official Claude Code marketplace JSON Schema
- Established TDD workflow with 4 test cases covering schema validation (MIDX-01), required fields (MIDX-01), plugin entry format (MIDX-02), and name uniqueness (MIDX-03)
- Fetched and stored local copy of official JSON Schema for deterministic validation
- Set up project scaffold with AJV, Vitest, Prettier devDependencies

## Task Commits

Each task was committed atomically:

1. **Task 1: Project scaffold + failing validation tests (RED)** - `20df512` (test)
2. **Task 2: Create marketplace.json + make all tests pass (GREEN)** - `08717a4` (feat)

_Note: TDD tasks follow test -> feat cycle_

## Files Created/Modified
- `.claude-plugin/marketplace.json` - The marketplace index file with name, owner, description, empty plugins array
- `tests/marketplace.test.js` - Vitest test file with 4 test cases: schema validation, required fields, plugin entries, uniqueness
- `tests/schemas/marketplace.schema.json` - Local copy of official Claude Code marketplace JSON Schema (draft-07)
- `package.json` - Project config with ajv, ajv-formats, vitest, prettier devDependencies
- `package-lock.json` - Lock file for reproducible installs
- `.prettierrc` - Prettier formatting config (semi, 2-space tabs, es5 trailing comma)
- `.gitignore` - Ignores node_modules, coverage, .DS_Store

## Decisions Made
- Used `https://json.schemastore.org/claude-code-marketplace.json` for `$schema` field because the Anthropic URL returns 404 (per RESEARCH.md Pitfall 1)
- Added `ajv-formats` as an additional dependency because the official schema uses `format: "uri"` which AJV does not support without the formats plugin
- Used kebab-case `djarvur-plugin-marketplace` for the name field per schema requirement, with the human-readable "Djarvur Plugin Marketplace" omitted in favor of the description field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added ajv-formats dependency for uri format support**
- **Found during:** Task 1 (RED phase)
- **Issue:** The official marketplace JSON Schema uses `format: "uri"` on the homepage property. AJV with `strict: true` throws an error when encountering unknown formats, preventing schema compilation entirely
- **Fix:** Installed `ajv-formats` package and added `addFormats(ajv)` call in the test file before compiling the schema
- **Files modified:** package.json, package-lock.json, tests/marketplace.test.js
- **Verification:** Schema compiles successfully, tests run and fail for the correct reason (missing marketplace.json)
- **Committed in:** 20df512 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical functionality)
**Impact on plan:** Essential fix -- without ajv-formats, the test suite cannot compile the official schema at all. No scope creep.

## Issues Encountered
None - execution was smooth after the ajv-formats deviation was resolved.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Marketplace index file is structurally valid and ready for plugin entries (Phase 2 will add cc-websearch as the first entry)
- Validation test infrastructure is in place and can be extended for CI (Phase 3 will wire these tests into GitHub Actions)
- The test suite's uniqueness check and schema validation protect against malformed marketplace entries

## Self-Check: PASSED

All files verified present. All commits verified in git log.

---
*Phase: 01-marketplace-index-schema*
*Completed: 2026-05-22*
