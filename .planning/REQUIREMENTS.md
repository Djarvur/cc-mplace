# Requirements: Claude Code Plugin Marketplace

**Defined:** 2026-05-22
**Core Value:** Plugins are discoverable and installable via Claude Code CLI commands — no manual cloning, config editing, or guessing

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Marketplace Index

- [x] **MIDX-01**: marketplace.json exists at `.claude-plugin/marketplace.json` with valid schema (name, owner, description, plugins)
- [x] **MIDX-02**: Each plugin entry has name, source, version, description, displayName
- [x] **MIDX-03**: Plugin names are unique across the marketplace (no duplicates)
- [x] **MIDX-04**: Marketplace is addable via `claude plugin marketplace add Djarvur/cc-mplace`

### Plugin Entry

- [x] **PLUG-01**: cc-websearch is listed as the first plugin with correct metadata
- [x] **PLUG-02**: Plugin source resolves correctly — repo URL points to cc-websearch, plugin is installable via `claude plugin install cc-websearch`

### CI Validation

- [x] **CIVAL-01**: GitHub Actions workflow validates marketplace.json schema on every PR
- [x] **CIVAL-02**: CI runs `claude plugin validate .` as a validation check
- [x] **CIVAL-03**: CI verifies plugin source repos are reachable and contain valid plugin.json manifest

### Documentation

- [x] **DOCS-01**: README explains what this marketplace is, how to add it (`claude plugin marketplace add`), and how to install plugins (`claude plugin install`)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Publishing Flow

- **PUBS-01**: CONTRIBUTING.md documents how to submit a plugin via PR
- **PUBS-02**: PR template standardizes plugin submission format
- **PUBS-03**: Automated CI response comments on PRs with validation results

### Plugin Metadata

- **META-01**: SHA pinning for deterministic, reproducible installs
- **META-02**: Category and tag taxonomy for plugin discovery
- **META-03**: Additional Djarvur plugin entries beyond cc-websearch

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature                        | Reason                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Website / landing page         | CLI is the interface; existing aggregators (ClaudePluginHub, claudemarketplaces.com) already provide web browsing |
| User accounts / authentication | PR-based flow; GitHub accounts are authentication                                                                 |
| Download counts / analytics    | Static JSON cannot track installs; GitHub stars are a proxy                                                       |
| User reviews / ratings         | Requires backend, moderation, spam prevention                                                                     |
| Custom CLI                     | Claude Code CLI handles all install/resolve/update behavior natively                                              |
| Plugin binary distribution     | Increases complexity; plugins use npm or install deps at install time                                             |
| Real-time updates / webhooks   | Static architecture; users run `claude plugin marketplace update`                                                 |
| Plugin signing / code signing  | Overkill for curated single-author marketplace; SHA pinning is sufficient                                         |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase   | Status  |
| ----------- | ------- | ------- |
| MIDX-01     | Phase 1 | Complete |
| MIDX-02     | Phase 1 | Complete |
| MIDX-03     | Phase 1 | Complete |
| MIDX-04     | Phase 2 | Complete |
| PLUG-01     | Phase 2 | Complete |
| PLUG-02     | Phase 2 | Complete |
| CIVAL-01    | Phase 3 | Complete |
| CIVAL-02    | Phase 3 | Complete |
| CIVAL-03    | Phase 3 | Complete |
| DOCS-01     | Phase 2 | Complete |

**Coverage:**

- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---

_Requirements defined: 2026-05-22_
_Last updated: 2026-05-24 after Phase 3 Plan 01 completion_
