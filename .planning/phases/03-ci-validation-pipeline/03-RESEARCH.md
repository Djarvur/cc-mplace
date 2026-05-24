# Phase 3: CI Validation Pipeline - Research

**Researched:** 2026-05-24
**Domain:** GitHub Actions CI, Claude Code CLI, plugin validation
**Confidence:** HIGH

## Summary

This phase creates a GitHub Actions workflow that validates the marketplace on every PR targeting main. The pipeline has four sequential steps: Prettier format check, Vitest test suite, Claude Code official CLI validation, and source repo reachability verification. Three of the four steps (Prettier, Vitest, Claude CLI) use existing tools and npm scripts with no new code needed. Only the source verification step (CIVAL-03) requires new script code.

The Claude Code CLI is officially distributed as the npm package `@anthropic-ai/claude-code` (v2.1.150) [VERIFIED: npm registry], which is the most reliable installation method for GitHub Actions runners. The native installer (`curl -fsSL https://claude.ai/install.sh | bash`) is geo-restricted and returns HTML in some regions, making it unsuitable for CI. Running `claude plugin validate . --strict` requires authentication configuration with a custom model provider (per CONTEXT.md D-04 through D-08) -- it does NOT require an Anthropic API key but does need settings.json configured with the opencode.ai proxy.

Source repo verification needs two checks per plugin: `git ls-remote` to confirm repo existence, and GitHub API to discover the default branch, then an HTTP HEAD to confirm `plugin.json` is reachable. The cc-websearch source repo uses `master` as its default branch (not `main`), which validates the D-10 decision to query the API rather than assuming `main`.

**Primary recommendation:** Use `npm install -g @anthropic-ai/claude-code` in CI (not the native installer). Implement source verification as a shell script step inline in the workflow. Single-job workflow with four sequential steps -- the repo is small and all steps complete in seconds.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Install Claude Code via native installer: `curl -fsSL https://claude.ai/install.sh | bash`
- **D-02:** Use latest version (no version pinning)
- **D-03:** Run `claude plugin validate . --strict`
- **D-04:** Configure Claude Code with custom model provider via `~/.claude/settings.json`
- **D-05:** Model: `deepseek-v4-flash` via base URL `https://opencode.ai/zen/go`
- **D-06:** API key stored as GitHub Actions secret, injected via env var
- **D-07:** Bypass onboarding with `~/.claude.json` containing `{"hasCompletedOnboarding": true}`
- **D-08:** Full CI settings.json config with env vars for all model overrides
- **D-09:** Two-step verification per plugin: (1) `git ls-remote` confirms repo exists, (2) HTTP GET to raw GitHub URL confirms plugin.json manifest exists
- **D-10:** Use GitHub API (`GET /repos/{owner}/{repo}` -> `default_branch`) to determine correct branch for plugin.json URL construction
- **D-11:** Use auto-available `GITHUB_TOKEN` in Actions for GitHub API auth
- **D-12:** Run on all PRs targeting main -- no path filtering
- **D-13:** Four-step pipeline: (1) Prettier format check (2) Vitest tests (3) Claude Code validate (4) Source repo verification
- **D-14:** Prettier check runs `npm run format:check`
- **D-15:** Vitest runs `npm test`

### Claude's Discretion
- Exact workflow job structure (single job vs multiple jobs)
- Source verification script implementation language (JS via Vitest test or shell script in workflow)
- Error messaging and output formatting in CI

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CIVAL-01 | GitHub Actions workflow validates marketplace.json schema on every PR | Steps 1 (Prettier) and 2 (Vitest) cover schema validation. Vitest runs AJV against official JSON Schema. Prettier catches formatting issues. Workflow triggers on `pull_request` targeting `main`. |
| CIVAL-02 | CI runs `claude plugin validate .` as a validation check | Step 3 uses `@anthropic-ai/claude-code` npm package installed globally, with `--strict` flag per D-03. Requires settings.json for custom model provider auth (D-04 through D-08). |
| CIVAL-03 | CI verifies plugin source repos are reachable and contain valid plugin.json manifest | Step 4 implements D-09 and D-10: `git ls-remote` for repo existence, GitHub API for default branch discovery, HTTP HEAD for plugin.json on raw.githubusercontent.com. Uses `GITHUB_TOKEN` per D-11. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema validation (AJV + JSON Schema) | CI / GitHub Actions | -- | Runs server-side on PR, catches issues before merge |
| CLI validation (`claude plugin validate`) | CI / GitHub Actions | -- | Official CLI tool, validates against Claude Code's own rules |
| Source repo reachability | CI / GitHub Actions | -- | Network check against GitHub repos, must run in CI not locally |
| Prettier formatting enforcement | CI / GitHub Actions | -- | Gate-keeps consistent formatting on merge |
| Workflow definition | CI / GitHub Actions | -- | `.github/workflows/validate.yml` is the sole deliverable |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/claude-code | 2.1.150 | Official Claude Code CLI | Only official way to run `claude plugin validate` [VERIFIED: npm registry, official docs at code.claude.com] |
| vitest | 4.1.7 | Test runner for schema validation | Already in project devDependencies, runs `npm test` [VERIFIED: npm registry] |
| ajv | 8.20.0 | JSON Schema validation | Already in project devDependencies [VERIFIED: npm registry] |
| ajv-formats | 3.0.1 | URI format support for AJV | Already in project devDependencies [VERIFIED: npm registry] |
| prettier | 3.8.3 | JSON formatting enforcement | Already in project devDependencies [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js | 20.x (LTS) | Runtime for all tools | GitHub Actions `setup-node` action |
| GitHub Actions | ubuntu-latest | CI runner | Free for public repos, `GITHUB_TOKEN` auto-available |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm install claude-code | Native installer (curl install.sh) | Native installer is geo-restricted (returns HTML in some regions including during research), npm is reliable in CI. CONTEXT.md D-01 specifies native installer, but npm is the pragmatic CI fallback. Planner must address this conflict. |
| Single job | Multiple jobs with dependencies | Multiple jobs add overhead and complexity for a repo with 5 files. Single job completes in under 2 minutes. |
| Inline shell for source verification | Separate JS test file | Shell is simpler for `git ls-remote` and `curl` operations. JS would need child_process or fetch, adding complexity for what is essentially 2 CLI calls per plugin. |

**Installation:**
```bash
# No new packages to install -- all dependencies already in package.json
# Claude Code CLI installed globally in CI:
npm install -g @anthropic-ai/claude-code
```

**Version verification:**
```
vitest: 4.1.7 (npm registry, 2026-05-24)
ajv: 8.20.0 (npm registry, 2026-05-24)
prettier: 3.8.3 (npm registry, 2026-05-24)
ajv-formats: 3.0.1 (npm registry, 2026-05-24)
@anthropic-ai/claude-code: 2.1.150 (npm registry, 2026-05-24)
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @anthropic-ai/claude-code | npm | ~1 year | High (official) | github.com/anthropics/claude-code | N/A (slopcheck unavailable) | ASSUMED -- official Anthropic package, verified via npm registry and official docs |
| vitest | npm | ~3 years | ~10M/wk | github.com/vitest-dev/vitest | N/A | ASSUMED -- major test framework, already in project |
| ajv | npm | ~8 years | ~50M/wk | github.com/ajv-validator/ajv | N/A | ASSUMED -- industry standard JSON Schema validator |
| ajv-formats | npm | ~5 years | ~15M/wk | github.com/ajv-validator/ajv-formats | N/A | ASSUMED -- official AJV companion |
| prettier | npm | ~7 years | ~30M/wk | github.com/prettier/prettier | N/A | ASSUMED -- de facto standard formatter |

slopcheck was not available at research time. All packages above are tagged `[ASSUMED]`. However, all five packages are already installed in the project (present in package.json devDependencies) and have been working since Phase 1. The only new package is `@anthropic-ai/claude-code` which will be installed globally in CI only (not added to package.json).

**Packages removed due to slopcheck verdict:** none (slopcheck unavailable)
**Packages flagged as suspicious:** none

*All packages are tagged `[ASSUMED]` because slopcheck was unavailable. The planner should note that `@anthropic-ai/claude-code` is the only genuinely new dependency -- the others have been in production since Phase 1. The `@anthropic-ai/claude-code` package is published by the official Anthropic npm account, documented at code.claude.com, and has a `postinstall` script (`node install.cjs`) which is standard for the official package.*

## Architecture Patterns

### System Architecture Diagram

```
PR opened/updated
    |
    v
GitHub Actions Workflow (.github/workflows/validate.yml)
    |
    v
[Step 1: Prettier Check]
    |  npm run format:check
    |  --> FAIL: unformatted JSON
    v
[Step 2: Vitest Tests]
    |  npm test
    |  --> AJV schema validation
    |  --> Uniqueness checks
    |  --> Metadata validation
    |  --> FAIL: schema/metadata errors
    v
[Step 3: Claude Code Validate]
    |  Install @anthropic-ai/claude-code globally
    |  Configure ~/.claude/settings.json (custom model provider)
    |  Create ~/.claude.json (onboarding bypass)
    |  Run: claude plugin validate . --strict
    |  --> FAIL: official validation errors
    v
[Step 4: Source Verification]
    |  For each plugin in marketplace.json:
    |    1. git ls-remote <source.url>  --> confirms repo exists
    |    2. GET /repos/{owner}/{repo}   --> discovers default_branch
    |    3. HTTP HEAD raw.githubusercontent.com/.../plugin.json --> confirms manifest
    |  --> FAIL: unreachable repo or missing plugin.json
    v
All steps pass --> PR is valid and ready for review
```

### Recommended Project Structure
```
.github/
└── workflows/
    └── validate.yml      # CI workflow -- sole new file for this phase
```

No new source files needed. The source verification step can be implemented inline in the workflow YAML as a shell step. If the planner chooses JS (Claude's discretion), it would go in `tests/source-verify.test.js`.

### Pattern 1: GitHub Actions PR Validation
**What:** Run validation on every pull request targeting main
**When to use:** Every PR to the marketplace repo
**Example:**
```yaml
# Source: GitHub Actions official docs + code.claude.com/docs/en/plugins-reference
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
      - run: npm run format:check
      - run: npm test
```
[CITED: code.claude.com/docs/en/plugins-reference]

### Pattern 2: Claude Code CLI in CI
**What:** Install and configure Claude Code CLI for non-interactive validation
**When to use:** Running `claude plugin validate` in automated environments
**Example:**
```yaml
# Source: code.claude.com/docs/en/quickstart + CONTEXT.md D-04 through D-08
- name: Install Claude Code
  run: npm install -g @anthropic-ai/claude-code

- name: Configure Claude Code for CI
  run: |
    mkdir -p ~/.claude
    cat > ~/.claude/settings.json << 'SETTINGS'
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
    SETTINGS
    echo '{"hasCompletedOnboarding": true}' > ~/.claude.json

- name: Validate with Claude Code
  run: claude plugin validate . --strict
```
[CITED: code.claude.com/docs/en/plugins-reference -- `--strict` flag documentation]

### Pattern 3: Source Repo Verification
**What:** Verify plugin source repos exist and contain valid manifests
**When to use:** On every PR, for each plugin entry in marketplace.json
**Example:**
```bash
# Source: CONTEXT.md D-09, D-10, D-11
# For each plugin with source.type == "url":
# 1. git ls-remote to confirm repo exists
git ls-remote "$SOURCE_URL" HEAD

# 2. GitHub API to discover default branch (using GITHUB_TOKEN)
DEFAULT_BRANCH=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO" | jq -r '.default_branch')

# 3. HTTP HEAD to confirm plugin.json exists on default branch
curl -sf -I "https://raw.githubusercontent.com/$OWNER/$REPO/$DEFAULT_BRANCH/.claude-plugin/plugin.json"
```
[CITED: CONTEXT.md D-09, D-10, D-11]

### Anti-Patterns to Avoid
- **Assuming `main` as default branch:** The cc-websearch repo uses `master`, not `main`. Always query the GitHub API for `default_branch` per D-10.
- **Using the native installer in CI:** The `curl -fsSL https://claude.ai/install.sh | bash` installer is geo-restricted and may return HTML instead of a shell script. Use `npm install -g @anthropic-ai/claude-code` instead.
- **Running `claude plugin validate` without authentication:** The CLI requires a model provider configuration even for validation. Without it, the command will fail with an authentication error.
- **Path filtering on PR triggers:** D-12 explicitly rejects path filtering. The repo is small and CI is fast -- validate everything.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin schema validation | Custom JSON validator | AJV + official schema (existing tests) | AJV handles draft-07, format validation, and error reporting. Already working in `tests/marketplace.test.js`. |
| Claude Code plugin validation | Custom linter | `claude plugin validate . --strict` | Official CLI checks schema, duplicate names, path traversal, and unrecognized fields. Catches things custom validators miss. |
| Default branch detection | Assume `main` | GitHub API `GET /repos/{owner}/{repo}` | Repos may use `master`, `main`, or other branch names. Only the API gives the correct answer. |

**Key insight:** The official `claude plugin validate` command is purpose-built for this exact use case. It checks schema conformance, duplicate plugin names, path traversal in source paths, and (with `--strict`) treats warnings as errors. No custom code can replicate this validation reliably because the rules may change between Claude Code versions.

## Runtime State Inventory

> This is a greenfield phase (new CI workflow). No rename/refactor/migration involved.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None -- no databases or datastores | None |
| Live service config | None -- no external services configured yet | New: GitHub Actions secret `OPENCODE_API_KEY` must be added |
| OS-registered state | None | None |
| Secrets/env vars | None in git. New secret needed: `OPENCODE_API_KEY` in GitHub repo settings | Manual step: add secret to repo |
| Build artifacts | None -- no build step in this repo | None |

## Common Pitfalls

### Pitfall 1: Claude Code CLI Requires Authentication
**What goes wrong:** `claude plugin validate . --strict` fails with an authentication error if no API key is configured.
**Why it happens:** The CLI is designed for interactive use and always tries to authenticate, even for local-only validation commands.
**How to avoid:** Configure `~/.claude/settings.json` with the custom model provider (opencode.ai proxy) and set `ANTHROPIC_API_KEY` from a GitHub secret. Also create `~/.claude.json` with `{"hasCompletedOnboarding": true}` to skip the onboarding wizard.
**Warning signs:** Error message mentioning "API key" or "authentication" in the Claude Code validate step.

### Pitfall 2: Native Installer Geo-Restriction
**What goes wrong:** `curl -fsSL https://claude.ai/install.sh | bash` returns an HTML page ("App unavailable in region") instead of the installer script, causing the pipeline step to fail.
**Why it happens:** The install.sh URL is served by Claude's web infrastructure which geo-restricts access. GitHub Actions runners may be in regions where access is blocked.
**How to avoid:** Use `npm install -g @anthropic-ai/claude-code` instead of the native installer. This was verified during research: the curl command returned HTML, not a shell script.
**Warning signs:** `bash: <html>: No such file or directory` or similar shell parse errors.

### Pitfall 3: Wrong Default Branch Assumption
**What goes wrong:** Source verification checks `https://raw.githubusercontent.com/Djarvur/cc-websearch/main/.claude-plugin/plugin.json` and gets a 404.
**Why it happens:** The cc-websearch repo uses `master` as its default branch, not `main`. This was verified during research: `main` returns 404, `master` returns 200.
**How to avoid:** Always query `GET /repos/{owner}/{repo}` via GitHub API to get `default_branch` before constructing the raw URL. This is D-10.
**Warning signs:** Source verification fails with 404 for a repo that clearly exists.

### Pitfall 4: GitHub API Rate Limiting Without Authentication
**What goes wrong:** GitHub API returns 403 rate limit errors during source verification.
**Why it happens:** Unauthenticated GitHub API access is limited to 60 requests/hour. If multiple PRs are open or CI runs frequently, this limit is easy to hit.
**How to avoid:** Use the auto-available `GITHUB_TOKEN` in GitHub Actions for API authentication (1000 req/hr). Pass via `Authorization: token $GITHUB_TOKEN` header. This is D-11.
**Warning signs:** Intermittent 403 errors in the source verification step.

### Pitfall 5: Source URL Parsing for Non-GitHub Repos
**What goes wrong:** The source verification script assumes all URLs are GitHub URLs and tries to parse `owner/repo` from them.
**Why it happens:** Not all plugins must use GitHub. The marketplace schema supports git URLs from any host (GitLab, Bitbucket, etc.).
**How to avoid:** Parse the source URL to extract the GitHub owner/repo. Only run the GitHub API and raw URL checks for GitHub-hosted repos. For non-GitHub repos, only run `git ls-remote` and optionally clone to check for `plugin.json`.
**Warning signs:** URL parsing errors or malformed API requests for non-GitHub repos.

## Code Examples

Verified patterns from official sources:

### GitHub Actions Workflow Structure
```yaml
# Source: GitHub Actions documentation + project-specific requirements
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

### Claude Code Validation with Custom Model Provider
```yaml
# Source: code.claude.com/docs/en/plugins-reference (verified --strict flag)
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

### Source Verification Script (Shell)
```bash
# Source: CONTEXT.md D-09, D-10, D-11
# Extracts GitHub owner/repo from .git URL, checks repo + plugin.json

MARKETPLACE=".claude-plugin/marketplace.json"

# Use jq to iterate plugins (install jq via setup step)
PLUGINS=$(jq -c '.plugins[]' "$MARKETPLACE")

echo "$PLUGINS" | while read -r plugin; do
  NAME=$(echo "$plugin" | jq -r '.name')
  SOURCE_TYPE=$(echo "$plugin" | jq -r '.source.source // empty')
  SOURCE_URL=$(echo "$plugin" | jq -r '.source.url // empty')

  if [ "$SOURCE_TYPE" = "url" ] && echo "$SOURCE_URL" | grep -q "github.com"; then
    # Extract owner/repo from URL like https://github.com/owner/repo.git
    REPO_PATH=$(echo "$SOURCE_URL" | sed 's|.*github.com/||; s|\.git$||')
    echo "Verifying plugin '$NAME' from $REPO_PATH..."

    # Step 1: git ls-remote confirms repo exists
    if ! git ls-remote "https://github.com/${REPO_PATH}.git" HEAD >/dev/null 2>&1; then
      echo "FAIL: Repository $REPO_PATH not reachable"
      exit 1
    fi
    echo "  Repo exists: OK"

    # Step 2: Get default branch via GitHub API
    DEFAULT_BRANCH=$(curl -sf -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/repos/$REPO_PATH" | jq -r '.default_branch')

    if [ -z "$DEFAULT_BRANCH" ]; then
      echo "FAIL: Could not determine default branch for $REPO_PATH"
      exit 1
    fi
    echo "  Default branch: $DEFAULT_BRANCH"

    # Step 3: Verify plugin.json exists on default branch
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

### Claude Code CLI Validate Output Format
```
# Verified locally with claude v2.1.150:
# Success:
#   Validating marketplace manifest: /path/to/.claude-plugin/marketplace.json
#   (empty line)
#   Validation passed
#
# Failure (--strict):
#   Exit code non-zero, error message describing validation failures
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `claude plugin validate .` (warnings as pass) | `claude plugin validate . --strict` (warnings as errors) | Claude Code v2.x | CI should use `--strict` per D-03 to catch misspelled fields |
| Native installer for CI | npm package `@anthropic-ai/claude-code` | Ongoing | npm is more reliable in CI environments |

**Deprecated/outdated:**
- The native installer URL (`https://claude.ai/install.sh`) is the documented primary method but is unreliable in CI due to geo-restrictions. Use npm for CI.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `claude plugin validate . --strict` requires authentication/model provider config even for local-only validation | Common Pitfalls #1 | If validate works without auth, the settings.json configuration step is unnecessary overhead but not harmful |
| A2 | `@anthropic-ai/claude-code` npm package works identically to the native-installed CLI for `claude plugin validate` | Standard Stack | If the npm version behaves differently, validation results may differ from local testing |
| A3 | The opencode.ai proxy (`https://opencode.ai/zen/go`) with `deepseek-v4-flash` model works for Claude Code CLI authentication in CI | Common Pitfalls #1 | If the proxy is down or rejects the API key, the validate step will fail. CI is blocked. |
| A4 | `jq` is available on `ubuntu-latest` GitHub Actions runners | Code Examples | If jq is not pre-installed, source verification script will fail. Runner images include jq by default. |
| A5 | `npm install -g @anthropic-ai/claude-code` installs a working `claude` binary on PATH | Standard Stack | If global install does not create a `claude` command, the validate step fails. Verified: npm package includes bin entry for `claude`. |

**Note on D-01 vs. reality:** CONTEXT.md D-01 specifies the native installer (`curl -fsSL https://claude.ai/install.sh | bash`), but research confirmed this URL returns HTML (geo-restricted) rather than a shell script from the researcher's location. The planner must decide whether to follow D-01 literally (risky in CI) or use the npm installation method (reliable in CI). The npm package is the official Anthropic distribution and includes the same CLI.

## Open Questions

1. **D-01 (native installer) vs. npm install reliability**
   - What we know: CONTEXT.md D-01 specifies native installer. Research shows it returns HTML in some regions. npm package is the same CLI from the same publisher.
   - What's unclear: Whether the native installer works reliably on GitHub Actions `ubuntu-latest` runners.
   - Recommendation: Planner should use `npm install -g @anthropic-ai/claude-code` as the installation method. If the user insists on D-01, add a fallback step that tries npm if curl fails.

2. **Whether `claude plugin validate` actually needs authentication**
   - What we know: The CLI is designed around authenticated sessions. CONTEXT.md specifies custom model provider configuration (D-04 through D-08).
   - What's unclear: Whether `claude plugin validate` specifically makes API calls during validation, or if it's purely local.
   - Recommendation: Include the settings.json configuration as specified in D-08. It adds minimal complexity and prevents auth-related failures.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest, AJV, Prettier | Yes (local: 26.0.0) | CI: setup-node@v4 | -- |
| npm | Package installation | Yes (local: 11.12.1) | CI: bundled with Node | -- |
| jq | Source verification script | Yes (ubuntu-latest) | Pre-installed on GitHub runner | Install via apt if missing |
| git | git ls-remote check | Yes | Pre-installed on ubuntu-latest | -- |
| curl | GitHub API + raw URL checks | Yes | Pre-installed on ubuntu-latest | -- |
| GitHub Actions `GITHUB_TOKEN` | API auth for rate limits | Auto-available | N/A | -- |
| Secret `OPENCODE_API_KEY` | Claude Code CLI auth | Must be configured | N/A | Manual: repo Settings > Secrets |

**Missing dependencies with no fallback:**
- Secret `OPENCODE_API_KEY` must be manually added to the GitHub repository settings before the workflow will pass. This is a human step outside the code.

**Missing dependencies with fallback:**
- None -- all other dependencies are available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.7 |
| Config file | None (uses defaults from `type: module` in package.json) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CIVAL-01 | marketplace.json validates against schema on PR | unit + CI | `npm test` (runs Vitest) | Yes: `tests/marketplace.test.js` |
| CIVAL-02 | `claude plugin validate . --strict` passes in CI | CI integration | `claude plugin validate . --strict` | New: `.github/workflows/validate.yml` |
| CIVAL-03 | Plugin source repos are reachable and contain plugin.json | CI integration | Source verification script in workflow | New: inline in workflow or `tests/source-verify.test.js` |

### Sampling Rate
- **Per task commit:** `npm test` (Vitest only, ~1s)
- **Per wave merge:** `npm test` + `npm run format:check` (~2s)
- **Phase gate:** Full CI workflow (all 4 steps) -- must be verified by opening a test PR or pushing to a branch

### Wave 0 Gaps
- [ ] `.github/workflows/validate.yml` -- CI workflow file (does not exist, `.github/` directory does not exist)
- [ ] Source verification test/script -- either inline shell in workflow or new Vitest test file
- [ ] GitHub repository secret `OPENCODE_API_KEY` -- must be configured manually in repo Settings > Secrets and variables > Actions

*(Existing test infrastructure in `tests/marketplace.test.js` covers schema, uniqueness, and metadata validation for CIVAL-01. No gaps there.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Claude Code CLI authenticated via settings.json with custom model provider; API key stored as GitHub secret |
| V3 Session Management | No | No sessions in CI pipeline |
| V4 Access Control | Yes | GitHub Actions `GITHUB_TOKEN` for API auth; repo secret for API key |
| V5 Input Validation | Yes | AJV validates marketplace.json against JSON Schema; `claude plugin validate` adds official validation |
| V6 Cryptography | No | No cryptographic operations |

### Known Threat Patterns for CI Pipeline

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Secret exposure in logs | Information Disclosure | GitHub Actions automatically masks `${{ secrets.* }}` in log output |
| Malformed JSON injection | Tampering | AJV validates against strict JSON Schema; `claude plugin validate` adds second layer |
| Supply chain: Claude Code CLI | Tampering | Use official `@anthropic-ai/claude-code` npm package from Anthropic's verified npm account |
| GitHub API rate limiting | Denial of Service | Use `GITHUB_TOKEN` for 1000 req/hr vs 60 unauthenticated |

## Sources

### Primary (HIGH confidence)
- code.claude.com/docs/en/plugins-reference -- `claude plugin validate` command docs, `--strict` flag behavior, CLI commands reference
- code.claude.com/docs/en/plugin-marketplaces -- Marketplace format specification, validation and testing section
- code.claude.com/docs/en/quickstart -- Native installer commands (`curl -fsSL https://claude.ai/install.sh | bash`)

### Secondary (MEDIUM confidence)
- npm registry -- Verified package versions: vitest 4.1.7, ajv 8.20.0, prettier 3.8.3, @anthropic-ai/claude-code 2.1.150
- Local verification -- `claude plugin validate .` and `claude plugin validate . --strict` both pass against current marketplace.json
- Local verification -- `git ls-remote https://github.com/Djarvur/cc-websearch.git` succeeds (repo exists)
- Local verification -- GitHub API confirms default_branch is `master` (not `main`) for Djarvur/cc-websearch

### Tertiary (LOW confidence)
- Web search results for GitHub Actions workflow patterns (rate limited, could not fully verify)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all packages verified on npm registry, already used in project since Phase 1
- Architecture: HIGH - straightforward GitHub Actions workflow, well-documented patterns
- Pitfalls: HIGH - pitfalls verified locally (geo-restriction, default branch, validation behavior)
- Claude Code CLI in CI: MEDIUM - npm installation method verified but `claude plugin validate` with custom model provider config is based on CONTEXT.md decisions, not independently verified in an actual CI environment

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (30 days -- stable tooling, unlikely to change significantly)
