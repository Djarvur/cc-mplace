# Roadmap: Claude Code Plugin Marketplace

## Overview

Build a static plugin marketplace for Claude Code. The project delivers a valid `marketplace.json` index that users add via CLI, with cc-websearch as the first installable plugin and CI validation protecting the registry. Three phases: create the index structure, make it work end-to-end with a real plugin, then add automated quality gates.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Marketplace Index & Schema** - Create the valid marketplace.json structure with correct schema and uniqueness constraints
- [x] **Phase 2: Plugin Integration & Documentation** - Make the marketplace work end-to-end with cc-websearch and document usage in README
- [x] **Phase 3: CI Validation Pipeline** - Add GitHub Actions CI to validate the marketplace on every PR (completed 2026-05-24)

## Phase Details

### Phase 1: Marketplace Index & Schema

**Goal**: A structurally valid marketplace.json exists with correct schema, plugin entry format, and uniqueness enforcement
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: MIDX-01, MIDX-02, MIDX-03
**Success Criteria** (what must be TRUE):

1. File `.claude-plugin/marketplace.json` exists and contains valid JSON with `name`, `owner`, `description`, and `plugins` fields
2. Each plugin entry in the plugins array has `name`, `source`, `version`, `description`, and `displayName` fields
3. No two plugin entries share the same `name` value (uniqueness is structurally enforced)
   **Plans**: 1 plan

Plans:

- [x] 01-01: Create marketplace.json + validation tests (TDD: RED then GREEN)

### Phase 2: Plugin Integration & Documentation

**Goal**: Users can add the marketplace via CLI, install cc-websearch from it, and read documentation explaining how
**Mode**: mvp
**Depends on**: Phase 1
**Requirements**: PLUG-01, PLUG-02, MIDX-04, DOCS-01
**Success Criteria** (what must be TRUE):

1. cc-websearch appears in the marketplace with correct metadata (name, source, version, description, displayName)
2. Running `claude plugin marketplace add Djarvur/cc-mplace` succeeds and the marketplace is registered
3. Running `claude plugin install cc-websearch` resolves the plugin and installs it successfully
4. README.md explains what the marketplace is, how to add it, and how to install plugins
   **Plans**: 2 plans

Plans:

- [x] 02-01: Add cc-websearch plugin entry + verify E2E CLI flow
- [x] 02-02: Write README.md with marketplace docs and plugin table

### Phase 3: CI Validation Pipeline

**Goal**: Every PR is automatically validated against the marketplace schema and plugin source requirements before merge
**Mode**: mvp
**Depends on**: Phase 2
**Requirements**: CIVAL-01, CIVAL-02, CIVAL-03
**Success Criteria** (what must be TRUE):

1. A GitHub Actions workflow runs on every PR and validates marketplace.json against the expected schema
2. CI executes `claude plugin validate .` as part of the validation pipeline
3. CI verifies that plugin source repos are reachable and contain a valid plugin.json manifest
   **Plans**: 2 plans

Plans:

**Wave 1**

- [x] 03-01: Create GitHub Actions workflow with four validation steps (Prettier, Vitest, Claude Code validate, source verification)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02: End-to-end CI verification -- configure GitHub secret, open test PR, confirm all steps pass

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase                                 | Plans Complete | Status            | Completed  |
| ------------------------------------- | -------------- | ----------------- | ---------- |
| 1. Marketplace Index & Schema         | 1/1            | Complete          | 2026-05-22 |
| 2. Plugin Integration & Documentation | 2/2            | Complete          | 2026-05-22 |
| 3. CI Validation Pipeline             | 2/2 | Complete   | 2026-05-24 |

### Phase 4: Periodic Dependency and Security Checks

**Goal**: Automated dependency audits and security vulnerability scans run on a schedule and on every PR
**Depends on:** Phase 3
**Requirements**: D-01 through D-11 (CONTEXT.md decisions)
**Plans:** 1 plan

Plans:

**Wave 1**

- [ ] 04-01: Create Dependabot config, auto-merge workflow, and repository settings (branch protection, auto-merge enable, labels)
