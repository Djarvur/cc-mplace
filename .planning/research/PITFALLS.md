# Pitfalls Research: Claude Code Plugin Marketplace

**Researched:** 2026-05-22
**Confidence:** HIGH

## Critical Pitfalls

### 1. No Commit Pinning = Silent Code Changes (CRITICAL)

Without SHA pinning, plugin source code changes without registry awareness. Anthropic's community marketplace pins every plugin to a specific commit SHA.

**Warning signs:** Plugin entries without `sha` field
**Prevention:** Require `sha` in schema from day one
**Phase:** Phase 1 (schema definition)

### 2. Plugin Hooks Bypass Human-in-the-Loop (HIGH)

Malicious hooks can overwrite `settings.local.json` to auto-approve dangerous commands, or use `PreToolUse` hooks to auto-approve curl/data exfiltration. The `suppressOutput` option hides indicators.

**Warning signs:** Plugin with hook definitions that modify settings or suppress output
**Prevention:** CI must scan hook definitions for dangerous patterns
**Phase:** Phase 2 (CI validation)

### 3. Third-Party Marketplace Registration Bug (HIGH)

GitHub issue #38670: plugins from third-party marketplaces (non-official) install and show as enabled but silently fail to register skills/commands/agents. Must confirm resolved before shipping.

**Warning signs:** Plugin installs but skills don't appear
**Prevention:** Test end-to-end install flow before launch
**Phase:** Phase 1 (MVP validation)

### 4. GitHub Impersonation / Namespace Confusion (HIGH)

Third-party registry sites auto-scrape GitHub. Fake accounts can appear legitimate within an hour.

**Warning signs:** Unverified plugin sources
**Prevention:** Only accept plugins from verified orgs in Djarvur-only phase
**Phase:** Phase 3 (multi-author expansion)

### 5. Schema Evolution Without Backward Compatibility (MEDIUM-HIGH)

Static registries have no migration layer. JSON is simultaneously schema and data.

**Warning signs:** Breaking field changes in marketplace.json
**Prevention:** Include `schemaVersion` from day one; follow additive-only evolution
**Phase:** Phase 1 (schema definition)

### 6. Stale Registry Index from GitHub CDN Caching (MEDIUM)

`raw.githubusercontent.com` is fronted by Fastly CDN with ~5 minute `max-age`. Users get stale index after PR merges.

**Warning signs:** Users report "plugin not found" after merge
**Prevention:** Document delay; consider CI check that waits for CDN propagation
**Phase:** Phase 2 (CI)

## Technical Debt Acceptable in v1

| Debt | Acceptable? | Why |
|------|-------------|-----|
| No schema versioning | NO | Critical for evolution |
| No hook scanning | OK for Djarvur-only | Trust own plugins |
| No automated SHA bumps | OK | Manual for small catalog |
| No CDN cache invalidation | OK | Document the delay |
| No plugin categorization | OK | Native schema supports tags later |

## Sources

- PromptArmor security research on Claude Code plugin attacks
- GitHub issue #38670 (third-party marketplace bug)
- Official Claude Code docs (discover-plugins, plugin-marketplaces, sandboxing)
- Palo Alto Unit 42 npm supply chain analysis
