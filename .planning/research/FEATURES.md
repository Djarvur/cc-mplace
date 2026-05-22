# Feature Research

**Domain:** Plugin marketplace/registry for Claude Code (static, GitHub-hosted, PR-based)
**Researched:** 2026-05-22
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature                                                     | Why Expected                                                               | Complexity | Notes                                                                                                                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Marketplace index (JSON catalog)                            | Every registry has a catalog; this is the core artifact                    | LOW        | Single `marketplace.json` file listing all plugins with metadata. Claude Code already reads this format natively.                                                                        |
| Plugin metadata schema (name, description, version, source) | Users need to know what they are installing before installing it           | LOW        | Required fields per official schema: `name`, `source`. Optional: `description`, `version`, `author`, `keywords`, `category`, `tags`, `displayName`, `license`, `homepage`, `repository`. |
| Install via CLI command                                     | The entire point of a marketplace is `plugin install <name>@<marketplace>` | LOW        | Claude Code already handles this natively once the marketplace is added. No custom CLI needed.                                                                                           |
| Marketplace add command                                     | Users must be able to add the marketplace source                           | LOW        | `claude plugin marketplace add Djarvur/cc-mplace` -- zero custom code, Claude Code handles it.                                                                                           |
| Plugin source resolution                                    | Each plugin must have a fetchable source (git repo, path, npm)             | LOW        | Official schema supports: `github`, `url`, `git-subdir`, `npm`, relative path. Each plugin entry needs a `source` field.                                                                 |
| Valid marketplace.json schema                               | Invalid JSON breaks the entire marketplace for every user                  | LOW        | `claude plugin validate .` exists. CI must run this on every PR.                                                                                                                         |
| At least one working plugin entry                           | An empty marketplace proves nothing                                        | LOW        | cc-websearch is designated as the first entry. Must have a valid `plugin.json` in its repo.                                                                                              |
| Plugin name uniqueness                                      | Duplicate names cause install ambiguity                                    | LOW        | CI validation catches duplicates. Enforced by `claude plugin validate`.                                                                                                                  |
| Basic documentation (README)                                | Users and contributors need to know how to use and submit                  | MEDIUM     | README explaining: what this is, how to add the marketplace, how to install plugins, how to submit new ones via PR.                                                                      |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature                                                    | Value Proposition                                                                                                           | Complexity | Notes                                                                                                                                                                        |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI validation on PR (schema + repo existence + smoke test) | Catches broken entries before merge; no other small marketplace does this systematically                                    | MEDIUM     | GitHub Actions workflow: validate JSON schema, check that plugin source repos exist and have valid manifests, run `claude plugin validate`. Badge on README shows CI status. |
| PR-based publishing flow with contributor guide            | Low-friction, transparent submission process. Git-based review workflow with no auth system needed.                         | LOW        | CONTRIBUTING.md with template for plugin entries. PR template listing checklist items. This is a process differentiator, not code.                                           |
| Category/tag taxonomy                                      | Enables filtered browsing and discovery. Most small marketplaces are flat lists.                                            | LOW        | Use `category` and `tags` fields in plugin entries. Claude Code's `/plugin` UI already supports displaying these.                                                            |
| Per-plugin version pinning (SHA or ref)                    | Security and reproducibility. Community marketplace (`claude-plugins-community`) pins each plugin to a specific commit SHA. | LOW        | Add `sha` field to plugin source entries. Claude Code natively supports this. Makes installed plugins deterministic.                                                         |
| Auto-update support                                        | Users get latest plugin versions without manual intervention                                                                | LOW        | Official marketplaces have auto-update enabled by default. Third-party ones default to off. Users can enable via UI. No custom code needed -- Claude Code handles it.        |
| Marketplace description and branding                       | Makes the marketplace feel professional when users see it in `/plugin` UI                                                   | LOW        | Top-level `description` and `owner` fields in `marketplace.json`. Takes 5 minutes to fill in.                                                                                |
| Dependency declaration between plugins                     | Enables plugin ecosystems where one plugin builds on another                                                                | MEDIUM     | Official schema supports `allowCrossMarketplaceDependenciesOn` at marketplace level. Per-plugin dependencies resolved by Claude Code. Only relevant when multi-plugin.       |
| Plugin health signals (CI status, repo activity)           | Helps users assess plugin quality before installing                                                                         | MEDIUM     | Could add custom metadata or link to repo stats. Not part of official schema -- would need README or separate file.                                                          |
| Release channels (stable/latest)                           | Enterprise users want stability; power users want bleeding edge                                                             | MEDIUM     | Supported via separate marketplace files pointing to different refs of the same plugin repos. Requires maintaining two `marketplace.json` files. Defer to v2.                |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature                                      | Why Requested                                                                                            | Why Problematic                                                                                                                                                                                                                                              | Alternative                                                                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web UI / website for browsing plugins        | Users want to browse visually; competitors like ClaudePluginHub and claudemarketplaces.com have websites | Requires hosting, build pipeline, deployment, maintenance. The official Anthropic marketplace already has claude.com/plugins. Competing websites already exist (claudepluginhub.com, claudemarketplaces.com, skills.sh). Duplicates effort for minimal gain. | Let the existing third-party directories crawl and index this marketplace. Focus on a clean `marketplace.json` that aggregators can consume. CLI is the interface per PROJECT.md scope. |
| User accounts / authentication               | Seems needed for "real" marketplaces                                                                     | Adds infrastructure, security surface, maintenance burden. Completely contradicts the static, zero-infrastructure architecture.                                                                                                                              | PR-based publishing. GitHub accounts ARE the authentication. Fork + PR is the submit flow.                                                                                              |
| Download counts / analytics                  | Seems like a basic quality signal                                                                        | Requires a backend to track installs. Static JSON file cannot count anything. Adding a tracking layer undermines simplicity.                                                                                                                                 | Use GitHub stars on plugin repos as a proxy. Or rely on external aggregators (skills.sh, claudemarketplaces.com) that track installs.                                                   |
| User reviews / ratings                       | Helps surface quality plugins                                                                            | Requires user accounts, moderation, spam prevention, database. Massive complexity for a static registry.                                                                                                                                                     | Community discussion happens in GitHub Issues and PRs. Quality signal via CI validation pass/fail.                                                                                      |
| Automated dependency resolution (transitive) | npm-like experience where deps are auto-resolved                                                         | Claude Code already handles plugin dependencies natively via `dependencies` field in `plugin.json`. Duplicating this at the marketplace level creates conflicts.                                                                                             | Rely on Claude Code's built-in dependency resolution. Declare deps in `plugin.json`, let the CLI handle it.                                                                             |
| Real-time updates / webhooks                 | Push notifications when plugins change                                                                   | Requires server infrastructure. Completely contradicts static architecture.                                                                                                                                                                                  | Users run `/plugin marketplace update` or enable auto-update. Poll-based, not push-based. Simple and works.                                                                             |
| Plugin signing / code signing                | Security best practice                                                                                   | Requires PKI infrastructure, key management, signing workflow. Overkill for a curated single-author marketplace. Out of scope until multi-author.                                                                                                            | Pin to commit SHA for deterministic installs. Trust is established via PR review of known-good repos.                                                                                   |
| Plugin binary distribution                   | Distributing pre-built binaries for performance                                                          | Increases index size, requires build pipeline, platform-specific builds. Massive complexity.                                                                                                                                                                 | Plugins that need deps use `npm` source type or install deps at plugin install time (like cc-websearch does with jsdom).                                                                |
| Search / fuzzy matching in marketplace       | Users want to find plugins by keyword                                                                    | Claude Code already provides search in the `/plugin` UI. Implementing search in a static JSON index adds no value -- the CLI does it.                                                                                                                        | Rely on Claude Code's built-in plugin search and discovery. Use `keywords`, `tags`, `category` fields for metadata.                                                                     |

## Feature Dependencies

```
Marketplace index (marketplace.json)
    |
    +--required-by--> Plugin entries (each with name + source)
    |                       |
    |                       +--enhanced-by--> Version pinning (sha/ref)
    |                       +--enhanced-by--> Category/tags metadata
    |                       +--enhanced-by--> Author/license metadata
    |
    +--required-by--> CI validation
    |                       |
    |                       +--requires--> Schema definition
    |                       +--requires--> Validation action (GitHub Actions)
    |
    +--enhanced-by--> Documentation (README, CONTRIBUTING)
    +--enhanced-by--> Marketplace description/owner metadata

PR-based publishing flow
    |
    +--requires--> CI validation (catches bad entries before merge)
    +--requires--> CONTRIBUTING.md (tells contributors how to submit)
    +--enhanced-by--> PR template (standardizes submissions)

Auto-update support
    |
    +--requires--> Version pinning (sha/ref) to detect changes
    +--requires--> Users explicitly enable (third-party marketplace default)

Release channels (stable/latest)
    |
    +--requires--> Multiple marketplace.json files
    +--conflicts-with--> Single-registry simplicity (defer to v2)
```

### Dependency Notes

- **CI validation requires schema definition:** Before CI can validate PRs, we need to know what valid looks like. The official `marketplace.json` schema is the reference. `claude plugin validate .` is the validation tool.
- **PR-based publishing requires CI validation:** Without CI, bad entries (broken JSON, missing repos) can be merged by accident. CI is the gatekeeper.
- **PR template enhances publishing flow:** A template standardizes what information contributors provide, making review faster.
- **Release channels conflicts with single-registry simplicity:** Maintaining two marketplace.json files doubles the maintenance surface. Only worth it when there is enough plugin volume to justify stable/latest distinction.
- **Version pinning enables auto-update detection:** When a plugin entry has a `sha` or `ref`, Claude Code can detect when it changes (new commit = new version). Without pinning, auto-update has nothing to compare against.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to validate the concept.

- [ ] **marketplace.json with cc-websearch entry** -- proves the marketplace works end-to-end: add, discover, install
- [ ] **Valid schema (name, owner, plugins with source)** -- Claude Code must be able to parse and use it
- [ ] **GitHub hosting (Djarvur/cc-mplace repo)** -- users add via `claude plugin marketplace add Djarvur/cc-mplace`
- [ ] **CI validation on PR** -- prevents broken entries from being merged
- [ ] **README with add/install instructions** -- users need to know how to use it
- [ ] **CONTRIBUTING.md with PR submission guide** -- enables future contributors to add plugins

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Additional Djarvur plugin entries** -- expand the catalog with other Djarvur plugins
- [ ] **Category/tag taxonomy** -- when catalog grows beyond 5+ plugins, organization matters
- [ ] **Version pinning (SHA)** -- once plugins are stable, pin to known-good commits for determinism
- [ ] **PR template** -- standardize submissions once there is a pattern of contributions
- [ ] **Plugin dependency declarations** -- when plugins start depending on each other

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Open third-party submissions** -- when community demand exists and review process is proven
- [ ] **Release channels (stable/latest)** -- when there are enough plugins and users to warrant it
- [ ] **Plugin health dashboard / metrics** -- when scale justifies it
- [ ] **Cross-marketplace dependency support** -- when depending on plugins from other marketplaces

## Feature Prioritization Matrix

| Feature                            | User Value | Implementation Cost | Priority |
| ---------------------------------- | ---------- | ------------------- | -------- |
| marketplace.json with valid schema | HIGH       | LOW                 | P1       |
| First plugin entry (cc-websearch)  | HIGH       | LOW                 | P1       |
| GitHub hosting (Djarvur/cc-mplace) | HIGH       | LOW                 | P1       |
| README with usage instructions     | HIGH       | LOW                 | P1       |
| CI validation on PR                | HIGH       | MEDIUM              | P1       |
| CONTRIBUTING.md                    | MEDIUM     | LOW                 | P1       |
| Category/tag metadata              | MEDIUM     | LOW                 | P2       |
| Version pinning (SHA)              | MEDIUM     | LOW                 | P2       |
| PR template                        | LOW        | LOW                 | P2       |
| Additional plugin entries          | MEDIUM     | LOW                 | P2       |
| Auto-update support documentation  | LOW        | LOW                 | P3       |
| Release channels                   | LOW        | MEDIUM              | P3       |
| Open third-party submissions       | MEDIUM     | HIGH                | P3       |

**Priority key:**

- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature              | Official Anthropic (claude-plugins-official)           | Anthropic Community (claude-plugins-community) | ClaudePluginHub                               | claudemarketplaces.com               | Our Approach                                  |
| -------------------- | ------------------------------------------------------ | ---------------------------------------------- | --------------------------------------------- | ------------------------------------ | --------------------------------------------- |
| **Hosting**          | GitHub repo, Anthropic-managed                         | GitHub repo, read-only mirror                  | Next.js website                               | Next.js website                      | GitHub repo, static JSON                      |
| **Submission**       | Submission form at clau.de/plugin-directory-submission | Same form; merged into community repo          | GitHub URL paste + sign-in                    | Auto-crawled from skills.sh, GitHub  | PR-based (fork, add entry, open PR)           |
| **Validation**       | Anthropic's internal review + automated validation     | Automated validation + safety screening        | Validates manifest/marketplace.json existence | 500+ install threshold, GitHub stars | CI on PR: schema check + repo existence check |
| **Discovery UI**     | claude.com/plugins + Claude Code CLI                   | Claude Code CLI only                           | Web browsing + search                         | Web browsing + voting                | Claude Code CLI only (no website)             |
| **Scope**            | Official integrations (GitHub, Jira, LSPs, etc.)       | Community-contributed, reviewed                | All public GitHub repos with plugin manifests | Curated, quality-filtered            | Djarvur-curated initially                     |
| **Version tracking** | Pinned to commit SHA                                   | Pinned to commit SHA                           | Not specified                                 | Crawls latest                        | Optional SHA/ref pinning                      |
| **Auto-update**      | Enabled by default                                     | Disabled by default (third-party)              | N/A (website, not marketplace)                | N/A (directory, not marketplace)     | Disabled by default (third-party)             |

### Key Insight: Market Positioning

The competitive landscape has three tiers:

1. **Official Anthropic tier**: `claude-plugins-official` and `claude-plugins-community` -- first-party, curated, built into Claude Code by default. We cannot and should not compete here.

2. **Aggregator/directory tier**: ClaudePluginHub, claudemarketplaces.com, skills.sh, claude-plugins.dev -- websites that crawl and index all public Claude Code plugins. They provide web-based discovery. We should ensure our marketplace is indexable by these.

3. **Author-curated marketplace tier** (our tier): Individual or org-curated marketplaces hosted as GitHub repos. This is exactly what Claude Code's marketplace system is designed for. Our competitive advantage is CI-validated quality and a clean PR-based contribution flow.

**We are not building a website or an aggregator.** We are building a curated, CI-validated marketplace that works natively with Claude Code's plugin system. The marketplace.json IS the product.

## Sources

- Official Claude Code marketplace docs: https://code.claude.com/docs/en/plugin-marketplaces
- Official Claude Code plugin discovery docs: https://code.claude.com/docs/en/discover-plugins
- Anthropic official plugins repo: https://github.com/anthropics/claude-plugins-official
- Anthropic community plugins repo: https://github.com/anthropics/claude-plugins-community
- ClaudePluginHub: https://www.claudepluginhub.com
- Claude Code Marketplaces: https://claudemarketplaces.com/about
- Build with Claude: https://jimmysong.io/ai/buildwithclaude/
- Community JSON schema: https://github.com/hesreallyhim/claude-code-json-schema
- VS Code extension publishing: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

---

_Feature research for: Claude Code plugin marketplace (static, GitHub-hosted, PR-based)_
_Researched: 2026-05-22_
