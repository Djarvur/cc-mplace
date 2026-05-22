# Project Research Summary

**Project:** cc-mplace (Djarvur Claude Code Plugin Marketplace)
**Domain:** Static plugin registry for Claude Code
**Researched:** 2026-05-22
**Confidence:** HIGH

## Executive Summary

This project is a third-party Claude Code plugin marketplace -- a static, GitHub-hosted registry that users add via `claude plugin marketplace add Djarvur/cc-mplace`. Claude Code already has a fully native marketplace system with a prescribed format (`.claude-plugin/marketplace.json`), CLI commands for add/install/update, and built-in validation. The project is not building new infrastructure; it is authoring a correctly structured JSON index and plugin directory that the existing Claude Code CLI consumes. The reference implementation is `anthropics/claude-plugins-official` (20.9k stars, 100+ plugins), which demonstrates the exact pattern to follow.

The recommended approach is minimal: create `marketplace.json` with valid plugin entries, colocate Djarvur-authored plugins under `plugins/` using relative path sources, and add CI validation to prevent broken entries from merging. There is no backend, no database, no web UI, and no custom CLI. The `marketplace.json` file IS the product. Everything else (discovery, install, update, caching, dependency resolution) is handled by Claude Code's CLI out of the box.

The primary risks are: (1) a known third-party marketplace registration bug (GitHub issue #38670) where plugins install but silently fail to register skills -- this must be confirmed resolved before launch; (2) security risks from plugin hooks that can bypass human-in-the-loop -- acceptable for Djarvur-only phase but needs CI scanning before accepting third-party plugins; (3) CDN caching on `raw.githubusercontent.com` causing ~5 minute delays after merges -- must be documented for users.

## Key Findings

### Recommended Stack

The stack is deliberately minimal. Claude Code's native marketplace system eliminates the need for custom infrastructure. The only tooling beyond the JSON index itself is CI validation.

**Core technologies:**

- **Claude Code native marketplace format** (`.claude-plugin/marketplace.json`) -- zero custom parsing, CLI handles everything
- **GitHub Actions** -- CI validation on PRs, runs `claude plugin validate .`
- **AJV 8.20.0** -- validates `marketplace.json` against the official JSON Schema (if custom schema checks beyond `claude plugin validate` are needed)
- **Vitest 4.1.7** -- for CI validation tests
- **Prettier 3.x** -- consistent JSON formatting in CI
- **Raw GitHub URLs** (`raw.githubusercontent.com`) -- zero-infrastructure hosting

**Explicitly rejected:** Custom JSON index format, Zod for validation, database/backend, GitHub Pages, custom CLI, web UI.

### Expected Features

The feature landscape is narrow and well-defined. Most "features" are actually properties of the JSON index, not code.

**Must have (table stakes):**

- Valid `marketplace.json` with correct schema (name, owner, plugins array with name/source)
- At least one working plugin entry (cc-websearch)
- Plugin name uniqueness (enforced by `claude plugin validate`)
- CI validation on PR (schema + source existence + `claude plugin validate`)
- README with add/install instructions
- CONTRIBUTING.md with PR submission guide

**Should have (competitive):**

- Per-plugin version pinning via SHA -- deterministic installs, matches official marketplace practice
- Category/tag taxonomy -- enables filtered discovery when catalog grows
- PR template -- standardizes submissions

**Defer (v2+):**

- Web UI / browsing website -- existing aggregators (claudepluginhub.com, claudemarketplaces.com, skills.sh) already fill this niche
- Open third-party submissions -- Djarvur-only at launch; the architecture supports external sources later without structural changes
- Release channels (stable/latest) -- requires maintaining multiple marketplace files
- User accounts, analytics, ratings -- contradicts static architecture

### Architecture Approach

The architecture is a single Git repository following the "marketplace-as-git-repo" pattern. Claude Code's CLI clones the repo, reads `marketplace.json`, and resolves plugin sources. For colocated plugins (Djarvur-authored), sources are relative paths like `./plugins/cc-websearch` that are copied from the already-cloned marketplace repo. For future third-party plugins, sources reference external GitHub repos with optional SHA pinning. The CI layer validates PRs before merge.

**Major components:**

1. **`.claude-plugin/marketplace.json`** -- the master index listing all plugins with metadata and source references; the single most important file in the project
2. **`plugins/` directory** -- colocated Djarvur plugin code, each with its own `.claude-plugin/plugin.json`, skills, and scripts
3. **`.github/workflows/validate.yml`** -- GitHub Actions CI that runs `claude plugin validate .` on every PR, catching schema errors, duplicate names, missing sources, and path traversal
4. **Claude Code CLI** (external) -- handles all dynamic behavior: marketplace add, plugin install, resolution, caching, updates

### Critical Pitfalls

1. **No commit pinning = silent code changes** -- Require `sha` in source entries from day one to ensure deterministic installs and detect tampering.
2. **Third-party marketplace registration bug (#38670)** -- Plugins install and appear enabled but skills silently fail to register. Must test the full end-to-end flow before launch and confirm this issue is resolved.
3. **Malicious hooks bypass human-in-the-loop** -- Plugins with `PreToolUse` or settings-modifying hooks can auto-approve dangerous commands. Acceptable risk for Djarvur-only phase; CI must scan hook definitions before accepting third-party submissions.
4. **Schema evolution without backward compatibility** -- Static JSON has no migration layer. Include `$schema` field from day one; follow additive-only field evolution.
5. **GitHub CDN caching delays** -- `raw.githubusercontent.com` has ~5 minute cache. Users may not see new plugins immediately after merge. Document this in README.

## Implications for Roadmap

Based on combined research, the project breaks into four phases with clear dependency ordering.

### Phase 1: Minimal Working Marketplace

**Rationale:** Everything depends on a valid `marketplace.json` that Claude Code can consume. This must exist before CI, PR flows, or additional plugins mean anything.
**Delivers:** A marketplace users can add and install cc-websearch from.
**Addresses:** marketplace.json schema, first plugin entry, GitHub hosting, README documentation.
**Avoids:** Pitfall #2 (third-party registration bug) by requiring end-to-end validation before considering the phase done.
**Research flag:** Standard patterns. The official marketplace repo and documentation provide exact examples to follow. No deep research needed.

### Phase 2: CI Validation Pipeline

**Rationale:** Before accepting any contributions (even from other Djarvur team members), automated validation must catch broken entries. CI is the quality gate that makes the PR-based workflow safe.
**Delivers:** Automated validation on every PR: schema check, duplicate name detection, source path existence, `claude plugin validate`.
**Uses:** GitHub Actions, Vitest for custom test cases, AJV for schema validation.
**Implements:** The CI validation layer from the architecture.
**Avoids:** Pitfalls #1 (SHA enforcement via CI), #4 (schema validation prevents malformed entries).
**Research flag:** Standard patterns. `claude plugin validate .` is a documented command. GitHub Actions workflow is straightforward.

### Phase 3: Contributor Experience

**Rationale:** With CI protecting the registry, the project can safely accept external PRs. This phase focuses on making contribution frictionless.
**Delivers:** CONTRIBUTING.md, PR template, category/tag taxonomy for organized browsing.
**Addresses:** PR-based publishing flow, contributor documentation.
**Research flag:** May need research. The CONTRIBUTING.md format and PR template should reference how other curated registries (Homebrew taps, npm scoped packages) handle submissions.

### Phase 4: Multi-Author Expansion

**Rationale:** Only after the Djarvur-only phase is proven, CI is solid, and contributor docs exist should the marketplace accept third-party plugins.
**Delivers:** External source support (`github`/`url` sources), SHA pinning enforcement, hook scanning in CI.
**Uses:** External source pattern from architecture research (Pattern 3: `{"source": "github", "repo": "owner/repo", "sha": "..."}`).
**Avoids:** Pitfall #3 (malicious hooks) by adding hook scanning; Pitfall #4 (namespace confusion) by verifying org ownership.
**Research flag:** Needs research. Security scanning patterns for plugin hooks, SHA verification workflows, and automated SHA bumping need investigation during planning.

### Phase Ordering Rationale

- **Phase 1 before Phase 2:** CI validates what exists. The marketplace must exist before it can be validated.
- **Phase 2 before Phase 3:** Contributors must not be able to merge broken entries. CI must be proven before opening to contributions.
- **Phase 3 before Phase 4:** Third-party submissions require a well-documented process and proven CI. The Djarvur-only phase validates the architecture.
- **Phase 4 is clearly v2 territory:** The PROJECT.md scope is Djarvur-only. Multi-author expansion is the natural growth path but not the launch target.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 4:** Security scanning for plugin hooks is a specialized domain. Need to research PromptArmor's findings in detail and determine which patterns to flag. Automated SHA bumping workflows need investigation.
- **Phase 1 (partial):** Must verify that GitHub issue #38670 is resolved before launch. This requires testing the actual third-party marketplace flow with a current Claude Code build.

Phases with standard patterns (skip research-phase):

- **Phase 1:** Well-documented. The official `anthropics/claude-plugins-official` repo provides the exact pattern to follow. Claude Code's marketplace docs are comprehensive.
- **Phase 2:** `claude plugin validate .` is a documented CLI command. GitHub Actions setup is standard.
- **Phase 3:** CONTRIBUTING.md and PR templates are well-established patterns. No novel research needed.

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                   |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Official Claude Code docs prescribe the exact format. Reference implementation (`claude-plugins-official`) confirms. No ambiguity.                      |
| Features     | HIGH       | Feature landscape is narrow -- most "features" are JSON fields, not code. Competitor analysis covers the full landscape. Anti-features well-documented. |
| Architecture | HIGH       | Architecture is dictated by Claude Code's CLI expectations. Component boundaries are clear. Data flows documented in official docs.                     |
| Pitfalls     | HIGH       | Sources include official docs, GitHub issues, PromptArmor security research, and Palo Alto Unit 42 analysis. Pitfalls are concrete and actionable.      |

**Overall confidence:** HIGH

### Gaps to Address

- **GitHub issue #38670 resolution status:** Must verify during Phase 1 that third-party marketplace registration works correctly with current Claude Code build. If unresolved, this blocks launch.
- **Schema version field support:** Research did not confirm whether `schemaVersion` is an officially supported field in `marketplace.json`, or if versioning is purely through the `$schema` field reference. Check the official JSON Schema definition during implementation.
- **Plugin hook security scanning tooling:** No off-the-shelf tool was identified for scanning plugin hook definitions for dangerous patterns. Phase 4 planning will need to define what constitutes a "dangerous hook pattern" and how to detect it.

## Sources

### Primary (HIGH confidence)

- Claude Code official marketplace docs: https://code.claude.com/docs/en/plugin-marketplaces -- marketplace.json format, CLI commands, validation
- Claude Code plugin reference docs: https://code.claude.com/docs/en/plugins-reference -- plugin.json format, component types
- Official Anthropic marketplace repo: https://github.com/anthropics/claude-plugins-official -- reference implementation with 100+ plugins
- Official Anthropic community marketplace: https://github.com/anthropics/claude-plugins-community -- SHA pinning patterns, third-party marketplace structure

### Secondary (MEDIUM confidence)

- PromptArmor security research -- Claude Code plugin attack vectors (hook abuse, settings modification)
- GitHub issue #38670 -- third-party marketplace registration bug report
- Palo Alto Unit 42 -- npm supply chain attack patterns applicable to plugin registries
- Homebrew tap documentation: https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap -- analogous registry pattern

### Tertiary (LOW confidence)

- ClaudePluginHub: https://www.claudepluginhub.com -- competitor feature analysis
- claudemarketplaces.com -- competitor feature analysis
- skills.sh -- third-party plugin directory

---

_Research completed: 2026-05-22_
_Ready for roadmap: yes_
