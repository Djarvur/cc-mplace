# Phase 3: CI Validation Pipeline - Pattern Map

**Mapped:** 2026-05-24
**Files analyzed:** 2 new files
**Analogs found:** 1 / 2 (partial -- no existing CI workflows in repo)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.github/workflows/validate.yml` | config | batch | `node_modules/fast-uri/.github/workflows/ci.yml` | partial (external dep, not project code) |
| `tests/source-verify.test.js` (if JS approach) | test | request-response | `tests/marketplace.test.js` | exact |

## Pattern Assignments

### `.github/workflows/validate.yml` (config, batch)

**No in-repo analog exists.** The `.github/` directory does not exist yet. This is greenfield.

**Closest external analog:** `node_modules/fast-uri/.github/workflows/ci.yml`

**Structural pattern from external analog** (lines 1-42 of fast-uri ci.yml):
```yaml
name: CI

on:
  push:
    branches:
     - main
  pull_request:
    paths-ignore:
      - 'docs/**'
      - '*.md'

concurrency:
    group: "${{ github.workflow }}-${{ github.event.pull_request.head.label || github.head_ref || github.ref }}"
    cancel-in-progress: true

permissions:
  contents: read

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
        with:
          persist-credentials: false

      - uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: package.json
          check-latest: true

      - name: Install
        run: npm ci

      - name: Run tests
        run: npm test
```

**RESEARCH.md provides the complete target pattern** -- the workflow must contain four sequential steps in a single job: Prettier check, Vitest, Claude Code validate, source verification. RESEARCH.md lines 175-194, 199-230, and 237-249 contain the full YAML and shell excerpts for each step.

**Key deviations from external analog (must follow CONTEXT.md decisions instead):**
- Trigger: `pull_request` on `main` only (D-12) -- no push trigger, no path filtering
- No concurrency group needed (small repo, fast CI)
- Single job (D-13 discretion: planner chose single job)
- Extra steps beyond npm test: Prettier check, Claude Code validate, source verification

**Concrete workflow skeleton (from RESEARCH.md Code Examples, lines 316-336):**
```yaml
name: Validate Marketplace
on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Check formatting
        run: npm run format:check
      - name: Run tests
        run: npm test
```

**Claude Code CLI installation and config (from RESEARCH.md lines 340-368):**
```yaml
- name: Install Claude Code
  run: npm install -g @anthropic-ai/claude-code

- name: Configure Claude Code for CI
  run: |
    mkdir -p ~/.claude
    cat > ~/.claude/settings.json << 'EOF'
    {
      "env": {
        "ANTHROPIC_API_KEY": "${{ secrets.OPENCODE_API_KEY }}",
        "ANTHROPIC_BASE_URL": "https://opencode.ai/zen/go",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-flash",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-flash",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
        "DISABLE_TELEMETRY": "true",
        "DISABLE_COST_WARNINGS": "true",
        "CLAUDE_CODE_USE_BEDROCK": "",
        "API_TIMEOUT_MS": "3000000"
      },
      "model": "deepseek-v4-flash"
    }
    EOF
    echo '{"hasCompletedOnboarding": true}' > ~/.claude.json

- name: Validate with Claude Code
  run: claude plugin validate . --strict
```

**IMPORTANT -- D-01 vs. reality conflict:** CONTEXT.md D-01 specifies native installer (`curl -fsSL https://claude.ai/install.sh | bash`), but RESEARCH.md Pitfall #2 documents that this URL is geo-restricted and returns HTML in CI environments. RESEARCH.md recommends `npm install -g @anthropic-ai/claude-code` instead. Planner must resolve this conflict -- using npm is the pragmatic choice for CI reliability.

**Source verification script (from RESEARCH.md lines 371-418):**
```bash
MARKETPLACE=".claude-plugin/marketplace.json"
PLUGINS=$(jq -c '.plugins[]' "$MARKETPLACE")

echo "$PLUGINS" | while read -r plugin; do
  NAME=$(echo "$plugin" | jq -r '.name')
  SOURCE_TYPE=$(echo "$plugin" | jq -r '.source.source // empty')
  SOURCE_URL=$(echo "$plugin" | jq -r '.source.url // empty')

  if [ "$SOURCE_TYPE" = "url" ] && echo "$SOURCE_URL" | grep -q "github.com"; then
    REPO_PATH=$(echo "$SOURCE_URL" | sed 's|.*github.com/||; s|\.git$||')
    echo "Verifying plugin '$NAME' from $REPO_PATH..."

    if ! git ls-remote "https://github.com/${REPO_PATH}.git" HEAD >/dev/null 2>&1; then
      echo "FAIL: Repository $REPO_PATH not reachable"
      exit 1
    fi
    echo "  Repo exists: OK"

    DEFAULT_BRANCH=$(curl -sf -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$REPO_PATH" | jq -r '.default_branch')

    if [ -z "$DEFAULT_BRANCH" ]; then
      echo "FAIL: Could not determine default branch for $REPO_PATH"
      exit 1
    fi
    echo "  Default branch: $DEFAULT_BRANCH"

    HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
      "https://raw.githubusercontent.com/${REPO_PATH}/${DEFAULT_BRANCH}/.claude-plugin/plugin.json")

    if [ "$HTTP_CODE" != "200" ]; then
      echo "FAIL: plugin.json not found at ${DEFAULT_BRANCH} branch (HTTP $HTTP_CODE)"
      exit 1
    fi
    echo "  plugin.json: OK"
  fi
done
```

---

### `tests/source-verify.test.js` (test, request-response) -- IF JS approach chosen

**Analog:** `tests/marketplace.test.js` (exact match -- same test framework, same project, same directory)

**Imports pattern** (lines 1-6 of marketplace.test.js):
```javascript
import { describe, it, expect, beforeAll } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
```

**Test structure pattern** (lines 11-30 of marketplace.test.js):
```javascript
describe("marketplace.json", () => {
  let ajv, schema, validate, marketplace;

  beforeAll(() => {
    // Setup: load schema, compile validator, parse marketplace.json
    ajv = new Ajv({ strict: true });
    addFormats(ajv);
    schema = JSON.parse(
      readFileSync(resolve(__dirname, "schemas", "marketplace.schema.json"), "utf-8")
    );
    validate = ajv.compile(schema);
    marketplace = JSON.parse(
      readFileSync(resolve(__dirname, "..", ".claude-plugin", "marketplace.json"), "utf-8")
    );
  });

  it("validates against the official JSON Schema", () => { ... });
  it("plugin names are unique", () => { ... });
});
```

**If implementing source verification as a Vitest test**, the test would use:
- `import { describe, it, expect, beforeAll } from "vitest"` (same imports)
- `beforeAll` to load and parse `marketplace.json` (same pattern as existing test)
- `import { execSync } from "child_process"` for `git ls-remote` calls
- Native `fetch` (Node 20 has built-in fetch) for GitHub API and raw URL checks
- `process.env.GITHUB_TOKEN` for API authentication

**NOTE:** Planner has discretion on whether source verification is a shell script inline in the workflow or a separate Vitest test file. The shell approach is simpler and recommended in RESEARCH.md.

---

## Shared Patterns

### Test File Convention
**Source:** `tests/marketplace.test.js`
**Apply to:** Any new test file (e.g., `tests/source-verify.test.js`)
- ESM imports (`import` not `require`)
- `vitest` for test framework (`describe`, `it`, `expect`, `beforeAll`)
- `fileURLToPath`/`dirname` for `__dirname` shim (ESM pattern)
- `readFileSync` for loading JSON fixtures
- `resolve(__dirname, ...)` for relative path resolution

### Marketplace JSON Loading
**Source:** `tests/marketplace.test.js` lines 25-30
**Apply to:** Source verification test (if JS approach)
```javascript
marketplace = JSON.parse(
  readFileSync(
    resolve(__dirname, "..", ".claude-plugin", "marketplace.json"),
    "utf-8"
  )
);
```

### NPM Scripts (existing, no changes needed)
**Source:** `package.json` lines 5-8
```json
"scripts": {
  "test": "vitest run",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```
CI reuses these scripts directly -- no new scripts needed.

### Prettier Configuration (existing, no changes needed)
**Source:** `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.github/workflows/validate.yml` | config | batch | No `.github/` directory exists in the repo. This is the first CI workflow. RESEARCH.md provides complete code examples as the primary pattern source. |

**Mitigation:** RESEARCH.md contains verified, complete code examples for all four workflow steps (lines 175-249, 316-418). The planner should use these directly rather than extrapolating from the external node_modules analog, which differs significantly in trigger configuration and job structure.

---

## Metadata

**Analog search scope:** Project root (`/Users/nil/DiskD/W/Djarvur/cc-mplace/`), `tests/`, `node_modules/*/.github/workflows/`
**Files scanned:** 4 project files + 1 external workflow analog
**Pattern extraction date:** 2026-05-24
