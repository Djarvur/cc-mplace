# Phase 2: Plugin Integration & Documentation - Research

**Researched:** 2026-05-22
**Domain:** Claude Code marketplace plugin entry format, CLI commands, README documentation
**Confidence:** HIGH

## Summary

This phase adds the first plugin entry (cc-websearch) to the existing marketplace.json, writes a README.md, and verifies the end-to-end CLI flow. The marketplace infrastructure was established in Phase 1 -- schema validation, AJV tests, and the marketplace.json skeleton are all in place. The research confirms the exact plugin entry format required by the official Claude Code marketplace specification, the source object structure for external git repos, and the CLI commands for adding a marketplace and installing plugins.

The most critical finding is GitHub issue #38670: third-party marketplace plugins currently cannot register skills/commands/agents properly. The `claude plugin marketplace add` command itself works, and plugins appear as installed, but their skills and commands may not load. CONTEXT.md already accounts for this (D-08: document the error and proceed). This is a platform bug, not a marketplace issue.

**Primary recommendation:** Add the cc-websearch entry using the `url` source format with git URL, mirror plugin.json metadata, write a minimal README, run the E2E flow as a best-effort verification, and document any failures from issue #38670.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Mirror cc-websearch's plugin.json values exactly -- name, description come from the plugin's own manifest
- **D-02:** Source field uses official marketplace format: `{ "source": "url", "url": "https://github.com/Djarvur/cc-websearch.git" }` -- no local path, no shorthand
- **D-03:** Skip SHA pinning -- deferred to v2 (META-01). Source entry includes `source` and `url` only
- **D-04:** Include optional `author: { "name": "Djarvur" }` and `category: "search"` fields -- matches official marketplace pattern
- **D-05:** Minimal README (~30-50 lines) -- essentials only: what this is, how to add marketplace, how to install plugins
- **D-06:** Include a plugin table (name + description) -- lets users browse before installing
- **D-07:** Manually run `claude plugin marketplace add Djarvur/cc-mplace` and `claude plugin install cc-websearch` during development to verify the flow works
- **D-08:** If CLI flow fails due to a Claude Code bug (e.g., #38670), document the exact error and proceed -- phase still delivers marketplace entry + README. Bug is a platform issue, not a marketplace issue

### Claude's Discretion
None -- all implementation details were locked during discussion.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLUG-01 | cc-websearch is listed as the first plugin with correct metadata | Plugin entry format fully documented below; cc-websearch plugin.json values confirmed; exact JSON entry provided in Code Examples |
| PLUG-02 | Plugin source resolves correctly -- repo URL points to cc-websearch, plugin is installable via `claude plugin install cc-websearch` | `url` source format verified against official docs and official marketplace; CLI install command documented; issue #38670 caveat noted |
| MIDX-04 | Marketplace is addable via `claude plugin marketplace add Djarvur/cc-mplace` | CLI command verified against official docs; `owner/repo` shorthand confirmed as primary method |
| DOCS-01 | README explains what this marketplace is, how to add it, and how to install plugins | README scope locked (D-05, D-06); CLI commands documented; structure outlined |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Plugin metadata entry | Static JSON (marketplace.json) | -- | Marketplace is a static JSON file; entry is a data object, not code |
| CLI marketplace add | Claude Code CLI | -- | External tool; users run the command, we document it |
| README documentation | Static content (README.md) | -- | Markdown file rendered by GitHub; no build step |
| Schema validation | Test suite (Vitest + AJV) | -- | Existing tests from Phase 1 auto-validate new entries |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | ^4.1.7 | Test runner | Established in Phase 1; validates marketplace.json schema |
| AJV | ^8.20.0 | JSON Schema validation | Established in Phase 1; validates marketplace entries against official schema |
| ajv-formats | ^3.0.1 | URI format support for AJV | Required for `homepage` field URI validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Prettier | ^3.8.3 | JSON formatting | Run after modifying marketplace.json to keep consistent style |

### Alternatives Considered
None needed -- this phase uses the existing stack from Phase 1.

**Installation:**
No new packages required. All dependencies already installed.

**Version verification:**
```bash
# Already verified via package.json
npm ls vitest ajv ajv-formats prettier 2>/dev/null
```

## Package Legitimacy Audit

No new packages are installed in this phase. All dependencies were verified in Phase 1.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| *(no new packages)* | | | | | | |

## Architecture Patterns

### System Architecture Diagram

```
User Browser / GitHub
    |
    v
README.md (documentation)
    |-- "claude plugin marketplace add Djarvur/cc-mplace"
    |-- "claude plugin install cc-websearch"
    |
    v
GitHub Repository (Djarvur/cc-mplace)
    |
    +-- .claude-plugin/marketplace.json
    |       |
    |       +-- plugins[0]: cc-websearch entry
    |               |
    |               +-- source: { "source": "url", "url": "https://github.com/Djarvur/cc-websearch.git" }
    |                       |
    |                       v
    |               GitHub Repository (Djarvur/cc-websearch)
    |                       |
    |                       +-- .claude-plugin/plugin.json (name, version, description)
    |                       +-- MCP server, skills, hooks...
    |
    v
Claude Code CLI
    |-- claude plugin marketplace add Djarvur/cc-mplace
    |       (clones repo, reads marketplace.json, registers marketplace)
    |
    |-- claude plugin install cc-websearch
            (reads marketplace entry, clones cc-websearch repo, copies to cache)
```

### Recommended Project Structure
```
cc-mplace/
+-- .claude-plugin/
|   +-- marketplace.json          # [EDIT] Add cc-websearch entry to plugins array
+-- tests/
|   +-- marketplace.test.js       # [EXISTING] Auto-validates new entry
|   +-- schemas/
|       +-- marketplace.schema.json # [EXISTING] Official schema
+-- README.md                     # [NEW] Marketplace documentation
+-- package.json                  # [EXISTING] No changes needed
```

### Pattern 1: External Git URL Source Entry
**What:** Plugin entry in marketplace.json pointing to an external git repository
**When to use:** When the plugin lives in its own repository (not embedded in the marketplace repo)
**Example:**
```json
{
  "name": "cc-websearch",
  "displayName": "WebSearch",
  "version": "0.1.0",
  "description": "DDG-powered WebSearch and WebFetch replacement for Claude Code",
  "author": {
    "name": "Djarvur"
  },
  "category": "search",
  "source": {
    "source": "url",
    "url": "https://github.com/Djarvur/cc-websearch.git"
  }
}
```
[Source: Official Claude Code marketplace docs -- https://code.claude.com/docs/en/plugin-marketplaces] [VERIFIED: Official docs]

### Pattern 2: GitHub Shorthand Marketplace Add
**What:** Adding a marketplace using `owner/repo` format
**When to use:** When the marketplace is on GitHub
**Example:**
```bash
claude plugin marketplace add Djarvur/cc-mplace
```
[Source: Official Claude Code docs -- https://code.claude.com/docs/en/plugin-marketplaces] [VERIFIED: Official docs]

### Anti-Patterns to Avoid
- **Embedding the plugin in the marketplace repo:** cc-websearch has its own repo; use `url` source, not relative path. Relative paths are for plugins co-located in the marketplace repository.
- **Including `sha` field without a specific commit:** SHA pinning is deferred to v2 (D-03). Omit the field entirely.
- **Using `github` source type instead of `url`:** The `github` source type uses `repo: "owner/repo"` format. The `url` source type with full git URL is the pattern chosen in D-02.
- **Mismatching name/description from plugin.json:** D-01 mandates mirroring exact values. The plugin.json says `name: "cc-websearch"`, `description: "DDG-powered WebSearch and WebFetch replacement for Claude Code"`, `version: "0.1.0"`, `displayName: "WebSearch"`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom validator | Existing AJV tests from Phase 1 | Already covers schema conformance, uniqueness, required fields |
| Plugin install | Custom install script | `claude plugin install cc-websearch` | CLI handles cloning, caching, versioning |
| Marketplace registration | Custom registration | `claude plugin marketplace add Djarvur/cc-mplace` | CLI handles clone, manifest reading, registration |

**Key insight:** This phase is primarily a data-editing and documentation task. The infrastructure (schema, validation, tests) already exists from Phase 1.

## Common Pitfalls

### Pitfall 1: Issue #38670 -- Third-Party Plugin Skills Not Loading
**What goes wrong:** After `claude plugin marketplace add` and `claude plugin install`, the plugin appears installed but skills/commands/agents do not register. Hooks and CLAUDE.md load correctly.
**Why it happens:** Active Claude Code bug -- third-party marketplace plugins have broken skill/command/agent discovery.
**How to avoid:** Cannot avoid -- this is a platform bug. D-08 handles this: document the error and proceed.
**Warning signs:** `claude plugin list` shows the plugin as installed, but `/plugin` UI does not show the plugin's skills.

### Pitfall 2: Marketplace Name Not Matching Kebab-Case
**What goes wrong:** Plugin name contains uppercase letters, spaces, or special characters.
**Why it happens:** Schema requires kebab-case. The Claude.ai marketplace sync rejects non-kebab-case names.
**How to avoid:** cc-websearch plugin.json already uses kebab-case (`name: "cc-websearch"`). No issue here.
**Warning signs:** `claude plugin validate .` warns: `Plugin name "x" is not kebab-case`.

### Pitfall 3: `displayName` Requires Claude Code v2.1.143+
**What goes wrong:** Using `displayName` in a plugin entry when users have an older Claude Code version.
**Why it happens:** `displayName` was added in v2.1.143. Older versions ignore it.
**How to avoid:** The current Claude Code version on this machine is 2.1.144, which supports it. Since `displayName` is optional and gracefully degraded, including it is safe -- older versions just ignore it.
**Warning signs:** No warning -- the field is silently ignored on older versions.

### Pitfall 4: Source URL Without `.git` Suffix
**What goes wrong:** The `.git` suffix is omitted from the URL in the source object.
**Why it happens:** Some git hosts accept URLs without `.git`, but the Claude Code docs show it with `.git`.
**How to avoid:** D-02 specifies the URL as `https://github.com/Djarvur/cc-websearch.git` -- include `.git`. The official docs state the suffix is optional, but the official marketplace consistently uses `.git`.
**Warning signs:** Plugin install may work without `.git` but consistency with the official marketplace pattern is preferable.

### Pitfall 5: Prettier Reformatting marketplace.json
**What goes wrong:** After editing marketplace.json, Prettier reformats it differently from the existing style.
**Why it happens:** Phase 1 established Prettier as the formatter. Running `npm run format` will reformat.
**How to avoid:** Run `npm run format` after editing marketplace.json. This is expected behavior, not a bug.
**Warning signs:** CI format check fails if marketplace.json is not formatted.

## Code Examples

### Exact cc-websearch Plugin Entry
Derived from: cc-websearch plugin.json (local file at `/Users/nil/DiskD/W/Djarvur/cc-websearch/.claude-plugin/plugin.json`) + CONTEXT.md decisions D-01 through D-04.

```json
{
  "name": "cc-websearch",
  "displayName": "WebSearch",
  "version": "0.1.0",
  "description": "DDG-powered WebSearch and WebFetch replacement for Claude Code",
  "author": {
    "name": "Djarvur"
  },
  "category": "search",
  "source": {
    "source": "url",
    "url": "https://github.com/Djarvur/cc-websearch.git"
  }
}
```

### Resulting marketplace.json
After insertion into the existing Phase 1 marketplace.json:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "djarvur-plugin-marketplace",
  "description": "Curated plugins for Claude Code",
  "owner": {
    "name": "Djarvur"
  },
  "plugins": [
    {
      "name": "cc-websearch",
      "displayName": "WebSearch",
      "version": "0.1.0",
      "description": "DDG-powered WebSearch and WebFetch replacement for Claude Code",
      "author": {
        "name": "Djarvur"
      },
      "category": "search",
      "source": {
        "source": "url",
        "url": "https://github.com/Djarvur/cc-websearch.git"
      }
    }
  ]
}
```

### CLI Commands for README
```bash
# Add the marketplace
claude plugin marketplace add Djarvur/cc-mplace

# Install the websearch plugin
claude plugin install cc-websearch

# List installed plugins
claude plugin list
```
[Source: https://code.claude.com/docs/en/plugin-marketplaces] [VERIFIED: Official docs]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No third-party marketplace support | Third-party marketplaces via `owner/repo` | Claude Code v2.1.x | Users can add any GitHub-hosted marketplace |
| No `displayName` field | `displayName` for human-readable names | v2.1.143 | Plugin entries can have friendly names with spaces/casing |
| Plugin sources were only relative paths | `url`, `github`, `git-subdir`, `npm` source types | Plugin system launch | External repos can be referenced directly |

**Deprecated/outdated:**
- The Anthropic-hosted schema URL (`https://anthropic.com/claude-code/marketplace.schema.json`) was used by the official marketplace but the project uses the schemastore URL (`https://json.schemastore.org/claude-code-marketplace.json`) which was established in Phase 1.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Issue #38670 is still open and affects third-party plugin skill loading | Common Pitfalls | If fixed, E2E verification passes; if not, we document and proceed per D-08 |
| A2 | The cc-websearch repo is publicly accessible at `https://github.com/Djarvur/cc-websearch.git` | Code Examples | If repo is private, plugin install fails for all users |
| A3 | The `displayName` field in plugin.json is appropriate to carry over to the marketplace entry | Code Examples | If displayName should differ from plugin.json, D-01 conflicts; but D-01 says "mirror exactly" |

## Open Questions

1. **Is the cc-websearch repository publicly accessible?**
   - What we know: The local copy exists at `/Users/nil/DiskD/W/Djarvur/cc-websearch/`. The GitHub URL `https://github.com/Djarvur/cc-websearch.git` is assumed to be public.
   - What's unclear: Whether the repo is published publicly on GitHub or still private.
   - Recommendation: Verify by running `git -C /Users/nil/DiskD/W/Djarvur/cc-websearch remote -v` and checking if `git ls-remote https://github.com/Djarvur/cc-websearch.git` succeeds. If the repo is private, the marketplace entry needs `GITHUB_TOKEN` documentation or the repo must be made public first.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Test runner | Available | 26.0.0 | -- |
| npm | Package manager | Available | 11.12.1 | -- |
| claude CLI | E2E verification (D-07) | Available | 2.1.144 | -- |
| git | Version control | Available | (system) | -- |
| Vitest | Tests | Available | ^4.1.7 | -- |

**Missing dependencies with no fallback:**
None -- all dependencies available.

**Missing dependencies with fallback:**
None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.7 |
| Config file | None (uses defaults from package.json `"test": "vitest run"`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLUG-01 | cc-websearch listed with correct metadata | unit | `npm test` | Yes -- `tests/marketplace.test.js` covers schema + required fields |
| PLUG-02 | Plugin source resolves correctly | manual-only | `claude plugin install cc-websearch` | No -- manual verification per D-07/D-08 |
| MIDX-04 | Marketplace addable via CLI | manual-only | `claude plugin marketplace add Djarvur/cc-mplace` | No -- manual verification per D-07/D-08 |
| DOCS-01 | README documents usage | manual-only | Human review | No -- documentation quality is manual |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test` green + manual E2E verification (D-07)

### Wave 0 Gaps
- PLUG-01 is automatically covered by existing `tests/marketplace.test.js` -- the test iterates `marketplace.plugins` and validates each entry has `name` and `source`. The cc-websearch entry will pass these checks once added.
- PLUG-02 and MIDX-04 are manual-only by design (D-07/D-08).
- Consider adding a specific test that asserts `marketplace.plugins[0].name === "cc-websearch"` for explicit coverage, but this is optional since the generic tests already cover it.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | -- |
| V3 Session Management | No | -- |
| V4 Access Control | No | -- |
| V5 Input Validation | Yes | AJV validates marketplace.json against official JSON Schema |
| V6 Cryptography | No | -- |

### Known Threat Patterns for Static JSON Marketplace

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious plugin source URL | Tampering | Manual review of source URLs during PR; `claude plugin validate .` checks path traversal |
| Schema bypass | Tampering | AJV strict validation against official schema |

## Sources

### Primary (HIGH confidence)
- https://code.claude.com/docs/en/plugin-marketplaces -- Official marketplace specification, JSON format, CLI commands, plugin source types
- https://code.claude.com/docs/en/plugins-reference -- Plugin manifest format, CLI command reference, `displayName` field (v2.1.143+)
- https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json -- Reference implementation of official marketplace with 100+ plugin entries showing real-world patterns
- `/Users/nil/DiskD/W/Djarvur/cc-websearch/.claude-plugin/plugin.json` -- cc-websearch plugin manifest (local, verified)
- `/Users/nil/DiskD/W/Djarvur/cc-mplace/.claude-plugin/marketplace.json` -- Existing marketplace index (Phase 1 output)
- `/Users/nil/DiskD/W/Djarvur/cc-mplace/tests/schemas/marketplace.schema.json` -- Official JSON Schema for validation

### Secondary (MEDIUM confidence)
- https://github.com/anthropics/claude-code/issues/38670 -- Third-party marketplace plugin skill loading bug (status: open)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new packages; existing stack from Phase 1
- Architecture: HIGH -- straightforward data edit + documentation; official docs fully cover the format
- Pitfalls: HIGH -- issue #38670 confirmed via GitHub; already accounted for in CONTEXT.md D-08

**Research date:** 2026-05-22
**Valid until:** 30 days (stable -- marketplace format is documented and mature)
