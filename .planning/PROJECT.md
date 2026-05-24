# Claude Code Plugin Marketplace

## What This Is

A static plugin registry for Claude Code, live at `Djarvur/cc-mplace`. Plugin authors submit PRs with their plugin metadata; CI validates entries via a four-step pipeline; a single JSON index file is hosted at a raw GitHub URL. Users add the marketplace source with `claude plugin marketplace add` and install plugins with `claude plugin install <name>`. Dependabot keeps dependencies current with CI-gated auto-merge.

## Core Value

Plugins are discoverable and installable via Claude Code CLI commands — no manual cloning, config editing, or guessing.

## Requirements

### Validated

- ✓ Registry index: single JSON file listing all available plugins — v1.0
- ✓ Plugin metadata schema: name, display name, description, version, repo URL — v1.0
- ✓ `claude plugin marketplace add` reads the index from a raw GitHub URL — v1.0
- ✓ `claude plugin install <name>` resolves name to repo URL via the index — v1.0
- ✓ cc-websearch is the first plugin entry — v1.0
- ✓ CI validation on PR: Prettier, Vitest, Claude Code validate, source verification — v1.0
- ✓ README with CLI usage docs and plugin table — v1.0
- ✓ Dependabot + auto-merge for ongoing dependency maintenance — v1.0

### Active

- [ ] PR-based publishing flow with CONTRIBUTING.md and PR template
- [ ] Automated CI response comments on PRs with validation results
- [ ] SHA pinning for deterministic, reproducible installs
- [ ] Category and tag taxonomy for plugin discovery
- [ ] Additional Djarvur plugin entries beyond cc-websearch

### Out of Scope

- Website/landing page — CLI is the interface; existing aggregators (ClaudePluginHub, claudemarketplaces.com) provide web browsing
- Author tooling (plugin boilerplate generator, publish CLI) — manual PR for now
- User accounts / authentication — PR-based flow; GitHub accounts are authentication
- Download counts / analytics — static JSON cannot track installs
- User reviews / ratings — requires backend, moderation, spam prevention
- Custom CLI — Claude Code CLI handles all install/resolve/update behavior natively
- Plugin binary distribution — plugins use npm or install deps at install time
- Real-time updates / webhooks — static architecture; users run `claude plugin marketplace update`
- Plugin signing / code signing — overkill for curated single-author marketplace; SHA pinning is sufficient

## Context

**Shipped v1.0 in 2 days (2026-05-22 → 2026-05-24).**
4 phases, 6 plans, 8 tasks. ~11,300 lines changed.
Tech stack: JSON registry, AJV + ajv-formats for schema validation, Vitest for tests, Prettier for formatting, GitHub Actions CI, Dependabot for maintenance.

cc-websearch is the first plugin. Claude Code supports `claude plugin marketplace add Djarvur/cc-mplace` and `claude plugin install cc-websearch`.
CI pipeline: Prettier check → Vitest → `claude plugin validate --strict` → source repo verification via GitHub API.

## Constraints

- **Hosting**: Raw GitHub URL — zero infrastructure, just reference the main branch file
- **Index format**: Single JSON file — one HTTP fetch gets the full catalog
- **Publishing**: PR-based — authors fork, add entry, open PR against this repo
- **Namespace**: Djarvur-only initially — single-author curates all entries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static registry over live API | Zero infrastructure, zero cost, git-based review flow | ✓ Good |
| Single JSON index file | Single fetch, simple parsing, easy to validate | ✓ Good |
| PR-based publishing | Git review workflow, no auth system needed | ✓ Good |
| Raw GitHub URL hosting | No GitHub Pages config, no build step | ✓ Good |
| AJV + ajv-formats for schema validation | Validates against published JSON Schema directly; Zod would require re-implementing | ✓ Good |
| json.schemastore.org URL for $schema | Anthropic URL returns 404 | ✓ Good |
| Kebab-case name field | Schema requirement | ✓ Good |
| npm install for Claude Code CLI in CI | Native installer geo-restricted | ✓ Good |
| Inline shell script for source verification | Simpler than separate Vitest test | ✓ Good |
| GitHub API default_branch query | Don't assume branch name | ✓ Good |
| Dependabot + auto-merge workflow | Auto-merge requires workflow (not configurable in dependabot.yml) | ✓ Good |
| Branch protection on main | Required for safe auto-merge (PRs wait for CI) | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-24 after v1.0 milestone*
