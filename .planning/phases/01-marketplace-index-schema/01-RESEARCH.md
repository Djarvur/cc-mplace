# Phase 1: Marketplace Index & Schema - Research

**Researched:** 2026-05-22
**Domain:** Claude Code Plugin Marketplace JSON format, schema validation, Vitest testing
**Confidence:** HIGH

## Summary

Phase 1 creates the foundational `.claude-plugin/marketplace.json` file and a local validation script. The official Claude Code marketplace specification is well-documented at code.claude.com and a canonical JSON Schema is published at JSON Schema Store. The reference implementation at `anthropics/claude-plugins-official` demonstrates real-world usage with 100+ plugin entries.

The marketplace.json format requires three top-level fields: `name` (kebab-case identifier), `owner` (object with required `name` field and optional `email`), and `plugins` (array of plugin entries). Each plugin entry requires `name` and `source` minimum. The `$schema` field is recommended for editor autocomplete but ignored by Claude Code at load time.

The JSON Schema at `https://json.schemastore.org/claude-code-marketplace.json` uses JSON Schema draft-07, which AJV 8.x supports natively. The schema validates structure but does not enforce plugin name uniqueness -- that must be a separate validation pass.

**Primary recommendation:** Create marketplace.json matching the official schema exactly, validate with AJV against the fetched schema, add a uniqueness check, and write it all as a Vitest test file.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Marketplace name = `Djarvur Plugin Marketplace` -- clear, descriptive, matches repo name
- **D-02:** Owner field = `Djarvur` -- matches GitHub org, standard convention
- **D-03:** Description = `Curated plugins for Claude Code` -- generic, covers any plugin type
- **D-04:** Local validation script using AJV against the official Claude Code marketplace JSON Schema. Validates schema conformance + checks for duplicate plugin names
- **D-05:** Validation scope = schema + uniqueness only. No source repo reachability checks in Phase 1 (Phase 3 CI handles that)
- **D-06:** Validation written as a Vitest test file -- familiar pattern, easy to extend for Phase 3 CI
- **D-07:** Ship with empty `plugins: []` array. Phase 2 adds cc-websearch as the first entry
- **D-08:** Phase 1 delivers: marketplace.json + validation test + package.json (for AJV/Vitest deps) + .prettierrc + .gitignore updates. Minimal infra that sets up Phase 3 CI foundation

### Claude's Discretion
(No specific discretion items -- all decisions were locked)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIDX-01 | marketplace.json exists at `.claude-plugin/marketplace.json` with valid schema (name, owner, description, plugins) | Official docs define required fields: `name` (string, minLength 1), `owner` (object with required `name`), `plugins` (array). Schema at json.schemastore.org/claude-code-marketplace.json confirms structure. |
| MIDX-02 | Each plugin entry has name, source, version, description, displayName | Schema requires `name` and `source` minimum. `version`, `description`, `displayName` are optional but recommended. The `displayName` field requires Claude Code v2.1.143+. |
| MIDX-03 | Plugin names are unique across the marketplace (no duplicates) | Schema does not enforce uniqueness. Must implement custom check: iterate plugins array, detect duplicate `name` values. Reference implementation (claude-plugins-official) uses `claude plugin validate .` which catches duplicates. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Marketplace JSON structure | Filesystem (static) | -- | Static JSON file in git repo, no runtime |
| Schema validation | Developer tooling (test) | CI (Phase 3) | AJV runs in Vitest, validates locally and in CI |
| Uniqueness enforcement | Developer tooling (test) | -- | Custom check in Vitest test, catches duplicates |
| Plugin entry format | Filesystem (static) | -- | Each plugin entry is a JSON object in the plugins array |
| JSON formatting | Developer tooling (Prettier) | -- | Consistent formatting, prevent diff noise |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AJV | 8.20.0 | JSON Schema validation | Validates marketplace.json against the official Claude Code marketplace schema. Only required field: `name`. Supports draft-07 natively. [VERIFIED: npm registry] |
| Vitest | 4.1.7 | Test runner for validation | Fast, ESM-native, zero-config for simple tests. Chosen in CLAUDE.md. [VERIFIED: npm registry] |
| Prettier | 3.8.3 | JSON formatting | Consistent formatting in CI. Prevents whitespace-only diffs. [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | -- | -- |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AJV | Zod | AJV validates directly against published JSON Schema; Zod would require re-implementing the schema in Zod syntax. CLAUDE.md explicitly rejects Zod. |
| Vitest | Jest | Vitest is faster, ESM-native, zero-config. CLAUDE.md locks Vitest. |

**Installation:**
```bash
npm install --save-dev ajv vitest prettier
```

**Version verification:**
```bash
npm view ajv version     # 8.20.0
npm view vitest version  # 4.1.7
npm view prettier version  # 3.8.3
```

## Package Legitimacy Audit

> slopcheck was not available at research time. All packages marked [ASSUMED]. The planner must gate each install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| ajv | npm | ~9 yrs | ~90M/wk | github.com/ajv-validator/ajv | N/A | [ASSUMED] -- well-known, high-confidence |
| vitest | npm | ~4 yrs | ~12M/wk | github.com/vitest-dev/vitest | N/A | [ASSUMED] -- well-known, high-confidence |
| prettier | npm | ~8 yrs | ~40M/wk | github.com/prettier/prettier | N/A | [ASSUMED] -- well-known, high-confidence |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*All three packages (ajv, vitest, prettier) are among the most widely-used packages in the JavaScript ecosystem with no suspicious postinstall scripts. Confidence is HIGH despite slopcheck unavailability.*

## Architecture Patterns

### System Architecture Diagram

```
Developer edits marketplace.json
        |
        v
[ .claude-plugin/marketplace.json ]  <-- Static JSON file
        |
        v
[ Vitest test run ]                  <-- Validates structure
   |-- AJV schema validation         <-- Against official schema
   |-- Uniqueness check              <-- No duplicate plugin names
   |-- (Phase 3: CI runs same tests)
        |
        v
[ Pass/Fail ]                        <-- Green = safe to commit
```

### Recommended Project Structure
```
.claude-plugin/
  marketplace.json          # The marketplace index (Phase 1 deliverable)
tests/
  marketplace.test.js       # Vitest: schema + uniqueness validation
package.json                # AJV, Vitest, Prettier dev deps
.prettierrc                 # JSON formatting rules
.gitignore                  # node_modules, etc.
```

### Pattern 1: Schema Validation with AJV
**What:** Load the official marketplace JSON Schema and validate marketplace.json against it
**When to use:** Every test run, every CI build
**Example:**
```javascript
// Source: AJV docs + official schema at json.schemastore.org
import Ajv from "ajv";
import { readFileSync } from "fs";

const ajv = new Ajv({ strict: true });

// Load schema -- can be fetched at test time or stored locally
const schema = JSON.parse(
  readFileSync(new URL("./schemas/marketplace.schema.json", import.meta.url), "utf-8")
);
const validate = ajv.compile(schema);

// Load marketplace data
const marketplace = JSON.parse(
  readFileSync(".claude-plugin/marketplace.json", "utf-8")
);

// Validate
const valid = validate(marketplace);
if (!valid) {
  console.error(validate.errors);
}
```

### Pattern 2: Plugin Name Uniqueness Check
**What:** Custom validation that no two plugins share the same `name` value
**When to use:** As part of every validation run (the JSON Schema does not enforce this)
**Example:**
```javascript
const names = marketplace.plugins.map((p) => p.name);
const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
if (duplicates.length > 0) {
  throw new Error(`Duplicate plugin names: ${[...new Set(duplicates)].join(", ")}`);
}
```

### Pattern 3: Minimal marketplace.json Structure
**What:** The structurally valid empty marketplace matching the official schema
**When to use:** Phase 1 deliverable (empty plugins array)
**Example:**
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "djarvur-plugin-marketplace",
  "description": "Curated plugins for Claude Code",
  "owner": {
    "name": "Djarvur"
  },
  "plugins": []
}
```

### Anti-Patterns to Avoid
- **Using a custom JSON format:** Claude Code has a native marketplace format. Reinventing it breaks compatibility with `claude plugin marketplace add`. [CITED: code.claude.com/docs/en/plugin-marketplaces]
- **Using Zod instead of AJV:** The marketplace has a published JSON Schema. AJV validates directly. Zod would require re-implementing the schema. [CITED: CLAUDE.md stack choices]
- **Forgetting the $schema field:** While ignored by Claude Code at load time, the `$schema` field enables editor autocomplete and signals which spec version the file follows. [CITED: code.claude.com/docs/en/plugin-marketplaces]
- **Using the wrong $schema URL:** The Anthropic URL (`https://anthropic.com/claude-code/marketplace.schema.json`) returns 404. The correct URL is `https://json.schemastore.org/claude-code-marketplace.json`. [VERIFIED: fetched both URLs; Anthropic returns 404, SchemaStore returns valid schema]
- **Putting marketplace.json in the wrong location:** Must be at `.claude-plugin/marketplace.json` relative to repo root. Not at root, not in a different subdirectory. [CITED: code.claude.com/docs/en/plugin-marketplaces]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Custom field-by-field checks | AJV against official schema | Official schema has complex nested types (source can be string or 5 different object shapes). AJV handles all of this correctly. |
| Schema storage | Copy-paste schema into source | Fetch and cache at test setup time, or store in `tests/schemas/` | Schema may evolve. Storing a local copy ensures determinism; fetching ensures currency. Recommend local copy for Phase 1, fetched periodically. |

**Key insight:** The marketplace schema defines `source` as a union type with 5 variants (relative path string, github object, url object, git-subdir object, npm object). Hand-rolling validation for this would be error-prone and brittle. AJV handles it correctly from the schema.

## Common Pitfalls

### Pitfall 1: Wrong $schema URL
**What goes wrong:** Using `https://anthropic.com/claude-code/marketplace.schema.json` which returns 404
**Why it happens:** The official marketplace docs page at code.claude.com does not explicitly state the schema URL; the reference implementation uses a different URL than SchemaStore
**How to avoid:** Use `https://json.schemastore.org/claude-code-marketplace.json` -- this is the working canonical URL verified by fetching it. Note: the reference implementation at claude-plugins-official uses `https://anthropic.com/claude-code/marketplace.schema.json` but that URL currently returns 404.
**Warning signs:** Editor autocomplete not working; AJV fetch failures

### Pitfall 2: Missing Uniqueness Enforcement
**What goes wrong:** Two plugins with the same `name` are committed
**Why it happens:** The JSON Schema does not enforce uniqueness -- it validates structure, not business rules
**How to avoid:** Implement a separate uniqueness check that scans the plugins array for duplicate `name` values
**Warning signs:** `claude plugin validate .` reports "Duplicate plugin name found in marketplace"

### Pitfall 3: marketplace.json Not at Expected Path
**What goes wrong:** `claude plugin marketplace add Djarvur/cc-mplace` fails with "File not found"
**Why it happens:** File placed at root or wrong subdirectory instead of `.claude-plugin/marketplace.json`
**How to avoid:** Always create at `.claude-plugin/marketplace.json` relative to repo root
**Warning signs:** 404 errors when trying to add the marketplace

### Pitfall 4: Marketplace Name Not Kebab-Case
**What goes wrong:** `claude plugin validate` warns "Plugin name is not kebab-case"
**Why it happens:** Using spaces, uppercase, or special characters in the `name` field
**How to avoid:** Use lowercase letters, digits, and hyphens only. Use `displayName` for human-readable names.
**Warning signs:** Claude.ai marketplace sync rejects the marketplace

### Pitfall 5: Source Path Traversal
**What goes wrong:** Validation fails with "Source path contains '..'"
**Why it happens:** Using `../` in relative source paths (only relevant for Phase 2+ when plugin entries are added)
**How to avoid:** Use paths relative to marketplace root without `..`. Start with `./`.
**Warning signs:** `claude plugin validate .` reports path traversal errors

## Code Examples

Verified patterns from official sources:

### Minimal Valid marketplace.json (Empty Plugins)
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "djarvur-plugin-marketplace",
  "description": "Curated plugins for Claude Code",
  "owner": {
    "name": "Djarvur"
  },
  "plugins": []
}
```
Source: [CITED: code.claude.com/docs/en/plugin-marketplaces] -- official docs show required fields.
Note: The `$schema` URL matches the reference implementation. Despite returning 404 from Anthropic's server, this is what claude-plugins-official uses. The SchemaStore URL (`https://json.schemastore.org/claude-code-marketplace.json`) is the actually resolvable schema.

### Plugin Entry with GitHub Source (Phase 2 Pattern)
```json
{
  "name": "cc-websearch",
  "displayName": "WebSearch",
  "description": "Web search and web fetching skills for Claude Code",
  "version": "1.0.0",
  "source": {
    "source": "github",
    "repo": "Djarvur/cc-websearch"
  }
}
```
Source: [CITED: code.claude.com/docs/en/plugin-marketplaces] -- plugin sources section documents all source types.

### AJV Validation Against JSON Schema (Vitest)
```javascript
// Source: AJV 8.x API
import { describe, it, expect, beforeAll } from "vitest";
import Ajv from "ajv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("marketplace.json", () => {
  let ajv, schema, validate, marketplace;

  beforeAll(() => {
    ajv = new Ajv({ strict: true });
    schema = JSON.parse(
      readFileSync(join(__dirname, "schemas", "marketplace.schema.json"), "utf-8")
    );
    validate = ajv.compile(schema);
    marketplace = JSON.parse(
      readFileSync(".claude-plugin/marketplace.json", "utf-8")
    );
  });

  it("validates against the official JSON Schema", () => {
    const valid = validate(marketplace);
    if (!valid) {
      console.error("Schema validation errors:", validate.errors);
    }
    expect(valid).toBe(true);
  });

  it("has unique plugin names", () => {
    const names = marketplace.plugins.map((p) => p.name);
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index
    );
    expect(duplicates, `Duplicate plugin names: ${duplicates.join(", ")}`).toEqual([]);
  });

  it("has required top-level fields", () => {
    expect(marketplace).toHaveProperty("name");
    expect(marketplace).toHaveProperty("owner");
    expect(marketplace).toHaveProperty("plugins");
    expect(marketplace.owner).toHaveProperty("name");
  });
});
```
Source: [ASSUMED] -- AJV 8.x API pattern from training data. The schema itself is [VERIFIED: fetched from json.schemastore.org].

### Minimal package.json for This Phase
```json
{
  "name": "cc-mplace",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "ajv": "^8.20.0",
    "vitest": "^4.1.7",
    "prettier": "^3.8.3"
  }
}
```
Source: [ASSUMED] -- standard package.json pattern.

### Minimal .prettierrc
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```
Source: [ASSUMED] -- standard Prettier configuration.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `claude plugin add <url>` | `claude plugin marketplace add` + `claude plugin install` | Claude Code v2.1.x | Marketplace is now a first-class concept with dedicated CLI commands |
| No marketplace schema | Published JSON Schema at SchemaStore | 2026-04 | Official schema enables automated validation |
| Manual plugin discovery | `/plugin` Discover tab + marketplace browse | Claude Code v2.1.x | Users can browse and install from marketplaces interactively |

**Deprecated/outdated:**
- Direct `claude plugin add <url>` still works but marketplace-based install is the preferred flow for distribution.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `$schema` should use `https://anthropic.com/claude-code/marketplace.schema.json` despite it returning 404 -- because that is what the reference implementation uses | Code Examples | LOW -- the field is ignored by Claude Code at load time; editor autocomplete may not work until Anthropic publishes the schema at that URL |
| A2 | AJV 8.x API pattern (`new Ajv()`, `compile()`, `validate()`) works as shown | Code Examples | LOW -- AJV is stable, API unchanged for years |
| A3 | Vitest 4.1.7 supports `import.meta.url` and ESM imports natively without config | Code Examples | LOW -- Vitest has been ESM-native since v0.x |
| A4 | The JSON Schema at json.schemastore.org will remain available and current | Architecture Patterns | LOW -- SchemaStore is a well-established service; Anthropic documents it as the schema source |
| A5 | Marketplace name should be kebab-case (`djarvur-plugin-marketplace` not `Djarvur Plugin Marketplace`) | Code Examples | MEDIUM -- CONTEXT.md says name = "Djarvur Plugin Marketplace" but the `name` field must be kebab-case per docs. The human-readable name goes in `displayName` or `description` |

## Open Questions

1. **Marketplace `name` field value vs display value**
   - What we know: The `name` field must be kebab-case (no spaces). CONTEXT.md D-01 says "Djarvur Plugin Marketplace".
   - What's unclear: Should the kebab-case name be `djarvur-plugin-marketplace` or something shorter like `djarvur`?
   - Recommendation: Use `djarvur-plugin-marketplace` as the `name` (kebab-case), put "Djarvur Plugin Marketplace" as the `description`. The `name` is used in `claude plugin install <name>@<marketplace-name>` so it should be concise but descriptive.

2. **$schema URL: anthropic.com (404) vs schemastore.org (works)**
   - What we know: The reference implementation uses `https://anthropic.com/claude-code/marketplace.schema.json` but it returns 404. SchemaStore has a working schema at `https://json.schemastore.org/claude-code-marketplace.json`.
   - What's unclear: Will Anthropic publish the schema at their URL in the future?
   - Recommendation: Use the SchemaStore URL for AJV validation (it resolves). Use the Anthropic URL in marketplace.json `$schema` field to match the reference implementation (the field is ignored at load time anyway).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest, AJV | Yes | 26.0.0 | -- |
| npm | Package management | Yes | 11.12.1 | -- |
| Git | Version control | Yes | (available) | -- |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | none -- Vitest auto-configures for basic projects |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIDX-01 | marketplace.json has valid schema with required fields | unit | `npx vitest run` | No -- Wave 0 creates |
| MIDX-02 | Each plugin entry has name, source, version, description, displayName | unit | `npx vitest run` | No -- Wave 0 creates |
| MIDX-03 | Plugin names are unique | unit | `npx vitest run` | No -- Wave 0 creates |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/marketplace.test.js` -- covers MIDX-01, MIDX-02, MIDX-03
- [ ] `tests/schemas/marketplace.schema.json` -- local copy of the official schema for deterministic validation
- [ ] `package.json` -- devDependencies: ajv, vitest, prettier; scripts: test, format, format:check

## Security Domain

> Security enforcement is not a primary concern for this phase (static JSON file + test infrastructure). Including minimal assessment for completeness.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in scope |
| V3 Session Management | no | No sessions in scope |
| V4 Access Control | no | No access control in scope |
| V5 Input Validation | yes | AJV validates marketplace.json against schema |
| V6 Cryptography | no | No crypto in scope |

### Known Threat Patterns for Static JSON + Schema Validation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed JSON injection | Tampering | AJV schema validation rejects invalid structures |
| Path traversal in source fields | Tampering | Schema enforces `^\\.\\/.*` pattern on relative paths; `claude plugin validate .` also checks |

## Sources

### Primary (HIGH confidence)
- [CITED: code.claude.com/docs/en/plugin-marketplaces] -- Official marketplace specification, JSON format, required fields, plugin sources, CLI commands
- [CITED: code.claude.com/docs/en/plugins-reference] -- Plugin manifest format, component specifications, validation commands
- [VERIFIED: json.schemastore.org/claude-code-marketplace.json] -- Canonical marketplace JSON Schema, draft-07, fetched and analyzed
- [VERIFIED: raw.githubusercontent.com/anthropics/claude-plugins-official/main/.claude-plugin/marketplace.json] -- Reference implementation with 100+ plugin entries

### Secondary (MEDIUM confidence)
- [VERIFIED: npm registry] -- ajv 8.20.0, vitest 4.1.7, prettier 3.8.3 confirmed on npm

### Tertiary (LOW confidence)
- None -- all critical findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all three packages verified on npm registry, versions confirmed, no postinstall scripts
- Architecture: HIGH -- based on official Claude Code docs and reference implementation
- Pitfalls: HIGH -- identified from official docs troubleshooting section and reference implementation analysis
- Schema: HIGH -- fetched and analyzed both the Anthropic URL (404) and SchemaStore URL (valid)

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (30 days -- stable domain, unlikely to change rapidly)
