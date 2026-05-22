# Architecture Research

**Domain:** Static plugin registry for Claude Code
**Researched:** 2026-05-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

This project is a Claude Code plugin marketplace -- a static registry hosted as a GitHub repository. It follows the exact same pattern as the official `anthropics/claude-plugins-official` and `anthropics/claude-plugins-community` repositories. Claude Code's plugin system already understands this pattern natively.

```
+------------------------------------------------------------------+
|                     Claude Code CLI (host)                        |
|  /plugin marketplace add owner/repo                               |
|  /plugin install name@marketplace                                 |
+----------+-------------------+-----------------------------------+
           |                   |
           v                   v
+----------------------+  +---------------------------+
| Marketplace Repo     |  | Plugin Source Repos        |
| (this project)       |  | (e.g. Djarvur/cc-websearch)|
|                      |  |                           |
| .claude-plugin/      |  | .claude-plugin/           |
|   marketplace.json   |  |   plugin.json             |
| plugins/             |  | skills/                   |
|   cc-websearch/      |  |   websearch/SKILL.md      |
|     .claude-plugin/  |  |   webfetch/SKILL.md       |
|       plugin.json    |  | scripts/                  |
|     skills/          |  +---------------------------+
|       ...            |
+----------------------+
           ^
           |
+----------+-----------+
| CI Validation Layer  |
| GitHub Actions       |
| - Schema check       |
| - Repo existence     |
| - Duplicate names    |
+----------------------+
```

### Key Insight: This Is Not a New System

Claude Code already has a fully specified marketplace system. The architecture is dictated by the Claude Code CLI's expectations:

1. **Marketplace = Git repo** with `.claude-plugin/marketplace.json`
2. **Plugin entries** are listed in `marketplace.json` with `source` pointing to each plugin
3. **Sources** can be relative paths (`./plugins/cc-websearch`), GitHub repos, git URLs, git-subdir, or npm packages
4. **CLI handles everything**: cloning, caching, versioning, updates

This project creates a third-party marketplace that the CLI can consume. The "build" is writing the correct JSON and directory structure.

### Component Responsibilities

| Component                  | Responsibility                                                                                                                      | Implementation                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `marketplace.json`         | Master index of all available plugins. Lists name, source, description, category for each plugin.                                   | Static JSON file at `.claude-plugin/marketplace.json` |
| Plugin directories         | Individual plugin code and manifests. Each plugin is self-contained with its own `plugin.json`, skills, scripts.                    | Directories under `plugins/` or `external_plugins/`   |
| `plugin.json` (per plugin) | Plugin metadata: name, version, description. Authority for component definitions when `strict: true`.                               | JSON file inside plugin's `.claude-plugin/` directory |
| CI validation              | Validates `marketplace.json` schema, checks for duplicate names, verifies plugin source paths exist, runs `claude plugin validate`. | GitHub Actions workflow                               |
| PR review flow             | Human review gate for new plugin submissions. Ensures quality before merge to main.                                                 | GitHub PR process (manual)                            |
| Claude Code CLI            | Consumer of the marketplace. Fetches `marketplace.json`, resolves sources, clones plugins into `~/.claude/plugins/cache/`.          | External -- already exists in Claude Code             |

## Recommended Project Structure

```
cc-mplace/
+-- .claude-plugin/
|   +-- marketplace.json          # The registry index (THE core file)
+-- plugins/                      # Djarvur-authored plugins (relative path sources)
|   +-- cc-websearch/             # First plugin
|       +-- .claude-plugin/
|       |   +-- plugin.json
|       +-- skills/
|       |   +-- websearch/
|       |   |   +-- SKILL.md
|       |   +-- webfetch/
|       |       +-- SKILL.md
|       +-- scripts/
|           +-- websearch.cjs
|           +-- webfetch.cjs
+-- .github/
|   +-- workflows/
|       +-- validate.yml          # CI: validate marketplace.json on PR
+-- README.md                     # How to add this marketplace, install plugins
+-- .gitignore
```

### Structure Rationale

- **`.claude-plugin/marketplace.json`**: Required by Claude Code. The CLI looks for this exact path when a user runs `claude plugin marketplace add owner/repo`. Not negotiable.
- **`plugins/`**: Colocating plugins in the marketplace repo (using relative path sources) gives zero-dependency installs. Users do not need network access beyond the initial marketplace fetch. This mirrors the `anthropics/claude-plugins-official` structure which uses `./plugins/xxx` and `./external_plugins/xxx`.
- **`.github/workflows/validate.yml`**: Automated quality gate. Runs on PRs to catch malformed JSON, duplicate names, missing sources before merge.
- **No `external_plugins/` initially**: PROJECT.md specifies Djarvur-only plugins at launch. External plugins (using `github` or `url` sources) can be added later without structural changes.

## Architectural Patterns

### Pattern 1: Marketplace-as-Git-Repo

**What:** The entire marketplace is a single Git repository. The `marketplace.json` file at `.claude-plugin/marketplace.json` is the sole index. Claude Code clones the repo, reads the JSON, and presents plugins to the user.

**When to use:** This is the only pattern Claude Code supports for marketplaces. There is no API-based or database-backed alternative.

**Trade-offs:**

- Pro: Zero infrastructure, free hosting on GitHub, version history via git, PR-based review flow
- Pro: The CLI already handles cloning, caching, and updates
- Con: Index size grows linearly with plugins (the official marketplace has 100+ plugins in a single JSON file with no issues)
- Con: Updates require a git push (not instant, but fine for a curated registry)

**Example:**

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "djarvur-marketplace",
  "description": "Djarvur's curated Claude Code plugins",
  "owner": {
    "name": "Djarvur"
  },
  "plugins": [
    {
      "name": "cc-websearch",
      "description": "DDG-powered WebSearch and WebFetch replacement for Claude Code",
      "source": "./plugins/cc-websearch",
      "category": "development"
    }
  ]
}
```

### Pattern 2: Relative Path Sources (Colocated Plugins)

**What:** Plugin code lives in the same repository as the marketplace. The `source` field in `marketplace.json` uses relative paths like `"./plugins/cc-websearch"`.

**When to use:** When the marketplace operator controls the plugin code. This is the Djarvur-only initial phase.

**Trade-offs:**

- Pro: Single repo to manage, no external dependencies, atomic updates
- Pro: Faster installs (one clone gets everything)
- Con: Repo size grows with plugin assets (compiled scripts, etc.)
- Con: Does not scale to third-party submissions (need `github`/`url` sources instead)

**Example:**

```json
{
  "name": "cc-websearch",
  "source": "./plugins/cc-websearch",
  "description": "WebSearch replacement for Claude Code",
  "version": "0.1.0",
  "category": "development"
}
```

### Pattern 3: External Git Sources (Third-Party Plugins, Future)

**What:** Plugin code lives in a separate repository. The `source` field uses `{"source": "github", "repo": "owner/plugin-repo"}` or `{"source": "url", "url": "https://..."}`.

**When to use:** When the marketplace accepts third-party plugins or when plugins are maintained independently. This is the pattern for multi-author expansion.

**Trade-offs:**

- Pro: Plugin authors maintain their own code
- Pro: Marketplace index stays small (just metadata, no code)
- Con: Two clones per install (marketplace + plugin)
- Con: Plugin repos can disappear, breaking installs (mitigate with `sha` pinning)
- Con: Version tracking requires `sha` or `ref` fields

**Example:**

```json
{
  "name": "cc-websearch",
  "source": {
    "source": "github",
    "repo": "Djarvur/cc-websearch",
    "ref": "master"
  },
  "description": "WebSearch replacement for Claude Code"
}
```

### Pattern 4: SHA Pinning for Immutability

**What:** Pin each plugin entry to a specific git commit SHA. The official marketplace does this for all external plugins.

**When to use:** For external (non-colocated) plugins. Ensures that the exact reviewed version is what users install, even if the plugin repo is updated later.

**Trade-offs:**

- Pro: Reproducible installs -- every user gets the same code
- Pro: Safety -- a compromised plugin repo cannot push malicious updates
- Con: Requires manual or CI-driven SHA bumps to update plugins
- Con: Not needed for colocated plugins (they move atomically with the marketplace)

## Data Flow

### Plugin Installation Flow

```
User runs: claude plugin marketplace add Djarvur/cc-mplace
    |
    v
Claude Code clones https://github.com/Djarvur/cc-mplace
    |
    v
Reads .claude-plugin/marketplace.json
    |
    v
Stores marketplace metadata in ~/.claude/plugins/
    |
    v
User runs: /plugin install cc-websearch@djarvur-marketplace
    |
    v
Claude Code resolves "cc-websearch" entry in marketplace.json
    |
    v
[For relative source "./plugins/cc-websearch"]
    Copies from already-cloned marketplace repo
    |
    v
[For external source {"source": "github", "repo": "..."}]
    Clones plugin repo separately
    |
    v
Copies plugin to ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/
    |
    v
Reads plugin.json, registers skills, agents, hooks, MCP servers
    |
    v
Plugin is active. Skills available as /cc-websearch:websearch
```

### Marketplace Update Flow

```
User runs: /plugin marketplace update djarvur-marketplace
    |
    v
Claude Code runs git pull on the cloned marketplace repo
    |
    v
Reads updated marketplace.json
    |
    v
Detects version changes for installed plugins
    |
    v
If versions changed: copies new version to cache
    |
    v
Plugin updates applied
```

### Publishing Flow (PR-Based)

```
Plugin author:
    1. Forks Djarvur/cc-mplace
    2. Adds plugin entry to marketplace.json (or plugin dir for colocated)
    3. Opens PR

CI (GitHub Actions):
    4. Runs claude plugin validate on marketplace directory
    5. Checks: JSON schema, duplicate names, source path traversal,
       version mismatches against plugin.json
    6. [Optional] Checks that external repo URLs are reachable
    7. Reports validation result on PR

Maintainer:
    8. Reviews PR (code, description, source validity)
    9. Merges to main
   10. Plugin is immediately available to all users on next marketplace update
```

### Key Data Flows

1. **Discovery:** CLI fetches `marketplace.json` --> user sees plugin list with names, descriptions, categories.
2. **Resolution:** User picks a plugin name --> CLI looks up `source` field --> determines fetch strategy (relative path copy vs. git clone).
3. **Installation:** CLI copies/clones plugin code --> reads `plugin.json` --> registers components (skills, agents, hooks, MCP).
4. **Validation:** CI reads `marketplace.json` on PR --> checks schema, uniqueness, source validity --> reports pass/fail.

## Component Boundaries

```
+---------------------------+
|   Marketplace Repo        |
|   (cc-mplace)             |
|                           |
|   marketplace.json        |<--- Claude Code CLI reads this
|   +-- plugins/            |<--- Source for relative plugins
|       +-- cc-websearch/   |
+---------------------------+
         |          ^
         | PR       | CI validate
         v          |
+---------------------------+
|   GitHub PR / CI          |
|   .github/workflows/      |
+---------------------------+

+---------------------------+
|   External Plugin Repos   |   (future phase)
|   e.g. Djarvur/cc-websearch
|                           |
|   .claude-plugin/         |<--- CLI clones this separately
|     plugin.json           |     when source is "github"/"url"
|   skills/                 |
+---------------------------+

+---------------------------+
|   Claude Code CLI         |   (external, already built)
|                           |
|   marketplace add         |---> clones repo, reads marketplace.json
|   plugin install          |---> resolves source, fetches plugin
|   plugin validate         |---> checks schema + components
+---------------------------+
```

### Internal Boundaries

| Boundary                            | Communication                  | Notes                                              |
| ----------------------------------- | ------------------------------ | -------------------------------------------------- |
| marketplace.json <-> plugin dirs    | Relative path reference        | Source paths like `"./plugins/cc-websearch"`       |
| marketplace.json <-> external repos | Git URL reference              | Source objects with `repo`, `ref`, `sha`           |
| CI <-> marketplace.json             | Schema validation              | `claude plugin validate .` checks everything       |
| CLI <-> marketplace.json            | HTTP (raw GitHub) or git clone | CLI fetches entire repo or just JSON               |
| CLI <-> plugin dirs                 | File copy from cloned repo     | Relative sources are copied from marketplace clone |
| CLI <-> external repos              | Separate git clone             | External sources trigger additional clone          |

## Build Order (Dependency Chain)

The components have a clear dependency order. Here is the recommended build sequence:

### Phase 1: Minimal Working Marketplace

**Goal:** Users can `claude plugin marketplace add Djarvur/cc-mplace` and install cc-websearch.

Components to build:

1. `.claude-plugin/marketplace.json` with cc-websearch entry
2. `plugins/cc-websearch/` directory with the plugin code (copied or symlinked from cc-websearch repo)
3. `README.md` with installation instructions
4. `.gitignore`

**Dependencies:** None. This is the starting point.

**Validation:** Run `claude plugin marketplace add ./local-path` locally, then `/plugin install cc-websearch@djarvur-marketplace`.

### Phase 2: CI Validation

**Goal:** PRs are automatically validated. Bad entries cannot merge.

Components to build:

1. `.github/workflows/validate.yml`
2. Run `claude plugin validate .` on PR
3. Check marketplace.json schema, duplicate names, source existence

**Dependencies:** Phase 1 must exist (CI validates what is already there).

### Phase 3: PR-Based Publishing Flow

**Goal:** External contributors can submit plugins via PR.

Components to build:

1. CONTRIBUTING.md with submission guidelines
2. PR template
3. Enhanced CI: repo existence check for external sources, SHA verification

**Dependencies:** Phase 2 must exist (validation must work before accepting PRs).

### Phase 4: Multi-Author Expansion

**Goal:** Accept third-party plugins with external sources.

Components to build:

1. Update marketplace.json entries to use `{"source": "github", "repo": "..."}` for external plugins
2. SHA pinning in CI
3. Automated SHA bump workflow (optional)

**Dependencies:** Phases 1-3 must be mature.

### Dependency Graph

```
Phase 1 (marketplace.json + plugin)
    |
    v
Phase 2 (CI validation)
    |
    v
Phase 3 (PR flow + CONTRIBUTING.md)
    |
    v
Phase 4 (external sources + multi-author)
```

## Anti-Patterns

### Anti-Pattern 1: Custom Index Format

**What people do:** Invent a new JSON schema for the plugin index instead of using the official `marketplace.json` format.
**Why it's wrong:** Claude Code's CLI only understands the official marketplace format. A custom format would not work with `claude plugin marketplace add` or `/plugin install`.
**Do this instead:** Use the exact `marketplace.json` schema documented at https://code.claude.com/docs/en/plugin-marketplaces. The `$schema` field provides editor autocomplete.

### Anti-Pattern 2: Duplicating Plugin Code in the Marketplace

**What people do:** Copy-paste the entire cc-websearch source code into the marketplace repo manually.
**Why it's wrong:** Diverges from upstream. Bug fixes in cc-websearch are not reflected in the marketplace copy. Creates maintenance burden.
**Do this instead:** Either use a git submodule, or (better) use an external source reference: `{"source": "github", "repo": "Djarvur/cc-websearch"}`. For colocated plugins, consider a build step that copies from the upstream repo.

### Anti-Pattern 3: No CI Validation

**What people do:** Merge PRs without automated checks, relying solely on human review.
**Why it's wrong:** Malformed JSON breaks the entire marketplace for all users. Duplicate names cause ambiguous installs. Missing sources cause install failures.
**Do this instead:** Run `claude plugin validate .` in CI on every PR. The validator checks schema, duplicates, source path traversal, and version mismatches.

### Anti-Pattern 4: Oversized Marketplace Index

**What people do:** Include hundreds of plugins with full descriptions, keywords, and metadata in a single JSON file.
**Why it's wrong:** While the official marketplace has 100+ entries and works fine, at extreme scale (1000+) the JSON becomes unwieldy to review in PRs and slow to fetch.
**Do this instead:** For the Djarvur-only phase (expected single-digit plugins), a single JSON file is perfect. If scale becomes an issue later, split into multiple marketplace repos.

## Scaling Considerations

| Scale                      | Architecture Adjustments                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1-5 plugins (Djarvur-only) | Single `marketplace.json`, all plugins colocated. Simple and correct.                                                        |
| 5-20 plugins               | Still a single JSON. Consider external sources for third-party plugins to keep repo size manageable.                         |
| 20-100 plugins             | Split into categories via multiple marketplace repos or use tags/categories within the JSON. Consider automated SHA bumping. |
| 100+ plugins               | Consider generating marketplace.json from a database or structured files. Split into multiple marketplace repos by category. |

### Scaling Priorities

1. **First bottleneck:** Manual PR review. With 5+ submissions per week, review becomes the bottleneck. Mitigate with comprehensive CI validation that catches common issues automatically.
2. **Second bottleneck:** JSON merge conflicts. Multiple PRs editing the same `marketplace.json` will conflict. Mitigate with a merge queue or automated rebase.

## Comparison with Reference Systems

### Homebrew Taps

| Aspect     | Homebrew Tap                       | Claude Code Marketplace                 |
| ---------- | ---------------------------------- | --------------------------------------- |
| Format     | Ruby `.rb` formula files           | JSON `marketplace.json`                 |
| Discovery  | `brew tap user/repo`               | `/plugin marketplace add owner/repo`    |
| Install    | `brew install user/repo/formula`   | `/plugin install name@marketplace`      |
| Update     | `brew update` (git pull)           | `/plugin marketplace update` (git pull) |
| Validation | `brew audit`                       | `claude plugin validate`                |
| Structure  | `Formula/name.rb`, `Casks/name.rb` | `plugins/name/` with `plugin.json`      |
| Hosting    | Any Git repo                       | Any Git repo                            |

**Key similarity:** Both are git-repo-based, zero-infrastructure registries. The tap/marketplace IS the repo.
**Key difference:** Homebrew uses per-formula files (Ruby), Claude Code uses a single JSON index + plugin directories.

### VS Code Extensions

| Aspect     | VS Code Marketplace                           | Claude Code Marketplace                     |
| ---------- | --------------------------------------------- | ------------------------------------------- |
| Format     | `package.json` per extension + VSIX packaging | `plugin.json` per plugin + marketplace.json |
| Discovery  | Visual Studio Marketplace (website + API)     | CLI-only (`/plugin install`)                |
| Publishing | `vsce publish` to marketplace API             | PR to marketplace repo                      |
| Hosting    | Microsoft's marketplace API servers           | GitHub (static)                             |
| Validation | Microsoft's review process                    | CI + human review                           |

**Key similarity:** Both use a manifest file (`package.json` / `plugin.json`) at the plugin root describing metadata and capabilities.
**Key difference:** VS Code uses a centralized API service. Claude Code uses static git repos -- no API, no database, no auth.

### npm Scoped Registries

| Aspect     | npm Registry                         | Claude Code Marketplace                     |
| ---------- | ------------------------------------ | ------------------------------------------- |
| Format     | `package.json` per package + CouchDB | `plugin.json` per plugin + marketplace.json |
| Discovery  | `npm search`, registry API           | CLI-only                                    |
| Publishing | `npm publish` to registry API        | PR to marketplace repo                      |
| Hosting    | npm registry servers (CouchDB)       | GitHub (static)                             |
| Validation | Package validation on publish        | CI + human review                           |

**Key similarity:** Both have per-package manifests with name, version, description.
**Key difference:** npm uses a live database backend with an HTTP API. Claude Code is fully static -- just files in a git repo.

## Integration Points

### External Services

| Service         | Integration Pattern              | Notes                                                |
| --------------- | -------------------------------- | ---------------------------------------------------- |
| GitHub          | Git hosting for marketplace repo | Primary hosting. Raw URL access for marketplace.json |
| Claude Code CLI | CLI consumes marketplace.json    | Already built. No work needed on marketplace side    |
| GitHub Actions  | CI validation on PR              | Runs `claude plugin validate`, schema checks         |

### Internal Boundaries

| Boundary                         | Communication         | Notes                                               |
| -------------------------------- | --------------------- | --------------------------------------------------- |
| marketplace.json <-> plugin dirs | Relative path strings | `"./plugins/cc-websearch"` resolved at install time |
| CI <-> marketplace repo          | Checkout + validation | GitHub Actions checks out PR branch, validates      |
| Users <-> marketplace            | CLI commands only     | Users never interact with the repo directly         |

## Sources

- Claude Code official marketplace docs: https://code.claude.com/docs/en/plugin-marketplaces (HIGH confidence -- official documentation, fetched verbatim)
- Claude Code plugin creation docs: https://code.claude.com/docs/en/plugins (HIGH confidence -- official documentation)
- Official marketplace `marketplace.json`: https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json (HIGH confidence -- real production file, 100+ plugin entries)
- Official marketplace repo structure: https://github.com/anthropics/claude-plugins-official (HIGH confidence -- production repo)
- cc-websearch plugin.json: `.claude-plugin/plugin.json` in Djarvur/cc-websearch (HIGH confidence -- verified by reading local file)
- Homebrew tap documentation: https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap (HIGH confidence -- official Homebrew docs)
- Homebrew taps overview: https://docs.brew.sh/Taps (HIGH confidence -- official Homebrew docs)

---

_Architecture research for: Claude Code plugin marketplace (static registry)_
_Researched: 2026-05-22_
