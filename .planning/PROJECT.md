# Claude Code Plugin Marketplace

## What This Is

A static plugin registry for Claude Code. Plugin authors submit PRs with their plugin metadata; CI validates entries; a single JSON index file is hosted at a raw GitHub URL. Users add the marketplace source with `claude plugin marketplace add` and install plugins with `claude plugin install <name>`.

## Core Value

Plugins are discoverable and installable via Claude Code CLI commands — no manual cloning, config editing, or guessing.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Registry index: single JSON file listing all available plugins
- [ ] Plugin metadata schema: name, display name, description, version, repo URL, plugin type (skills/MCP/both)
- [ ] `claude plugin marketplace add` reads the index from a raw GitHub URL
- [ ] `claude plugin install <name>` resolves name to repo URL via the index, clones, installs deps, registers
- [ ] cc-websearch (https://github.com/Djarvur/cc-websearch) is the first plugin entry
- [ ] PR-based publishing flow: author forks, adds entry, opens PR
- [ ] CI validation on PR: schema check, repo existence check, basic smoke test
- [ ] Djarvur-only plugins initially, designed for multi-author expansion

### Out of Scope

- Website/landing page for browsing plugins — CLI is the interface
- Author tooling (plugin boilerplate generator, publish CLI) — manual PR for now
- Automated submission — PR-based only
- Open third-party submissions from day one — Djarvur namespace first, multi-author later
- Plugin version resolution / update checking — single version per entry initially

## Context

- cc-websearch is a skills-based plugin (no MCP server). Manifest at `.claude-plugin/plugin.json`, skills in `skills/*/SKILL.md`. WebSearch skill is self-contained; WebFetch needs `npm install` for jsdom.
- Claude Code already supports `claude plugin add <url>` for direct plugin installation. The marketplace adds a discovery layer on top.
- The registry is static — no backend server, no database, no authentication. The raw GitHub URL of the index file is the marketplace endpoint.

## Constraints

- **Hosting**: Raw GitHub URL — zero infrastructure, just reference the main branch file
- **Index format**: Single JSON file — one HTTP fetch gets the full catalog
- **Publishing**: PR-based — authors fork, add entry, open PR against this repo
- **Namespace**: Djarvur-only initially — single-author curates all entries

## Key Decisions

| Decision                      | Rationale                                                         | Outcome   |
| ----------------------------- | ----------------------------------------------------------------- | --------- |
| Static registry over live API | Zero infrastructure, zero cost, git-based review flow             | — Pending |
| Single JSON index file        | Single fetch, simple parsing, easy to validate                    | — Pending |
| PR-based publishing           | Git review workflow, no auth system needed                        | — Pending |
| Raw GitHub URL hosting        | No GitHub Pages config, no build step, just reference main branch | — Pending |

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

_Last updated: 2026-05-22 after initialization_
