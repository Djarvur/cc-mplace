# Walking Skeleton -- Claude Code Plugin Marketplace

**Phase:** 1
**Generated:** 2026-05-22

## Capability Proven End-to-End

A valid marketplace.json at `.claude-plugin/marketplace.json` passes AJV schema validation against the official Claude Code marketplace JSON Schema, proving that the static registry structure is correct and ready for plugin entries.

## Architectural Decisions

| Decision               | Choice                                                                | Rationale                                                                                |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Registry format        | `.claude-plugin/marketplace.json` (official Claude Code format)       | Zero custom parsing; Claude Code CLI reads this natively                                 |
| Schema validation      | AJV 8.x against official JSON Schema (draft-07)                       | Published schema at json.schemastore.org; AJV validates directly without re-implementing |
| Uniqueness enforcement | Custom check in Vitest test (iterate plugins, detect duplicate names) | JSON Schema does not enforce uniqueness; separate pass required                          |
| Test framework         | Vitest 4.1.7                                                          | Fast, ESM-native, zero-config. Same tests run in CI (Phase 3)                            |
| Schema storage         | Local copy in `tests/schemas/marketplace.schema.json`                 | Deterministic validation; no network dependency at test time                             |
| Formatting             | Prettier 3.x                                                          | Consistent JSON formatting; prevents whitespace-only diffs                               |
| Marketplace name       | `djarvur-plugin-marketplace` (kebab-case)                             | Schema requires kebab-case for the `name` field; display name goes in `description`      |
| $schema URL            | `https://json.schemastore.org/claude-code-marketplace.json`           | Working canonical URL for editor autocomplete and AJV validation reference               |

## Stack Touched in Phase 1

- [x] Project scaffold (package.json, .gitignore, .prettierrc)
- [x] Marketplace JSON -- valid empty marketplace at `.claude-plugin/marketplace.json`
- [x] Schema validation -- AJV against official JSON Schema, local copy stored
- [x] Uniqueness check -- custom test scanning for duplicate plugin names
- [x] Formatting -- Prettier config applied to all project files

## Out of Scope (Deferred to Later Slices)

- Plugin entries in marketplace.json (Phase 2 adds cc-websearch)
- `claude plugin marketplace add` end-to-end test (Phase 2, requires pushing to GitHub)
- GitHub Actions CI pipeline (Phase 3)
- `claude plugin validate .` integration (Phase 3)
- Source repo reachability checks (Phase 3)
- README documentation (Phase 2)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Plugin Integration & Documentation -- add cc-websearch entry, test end-to-end CLI flow, write README
- Phase 3: CI Validation Pipeline -- GitHub Actions workflow running the same validation tests + `claude plugin validate .`
