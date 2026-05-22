---
phase: 01-marketplace-index-schema
reviewed: 2026-05-22T14:24:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - .claude-plugin/marketplace.json
  - tests/marketplace.test.js
  - tests/schemas/marketplace.schema.json
  - package.json
  - .prettierrc
  - .gitignore
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-05-22T14:24:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed 6 source files from Phase 1 (marketplace index and schema validation). The test suite passes (4/4) and the marketplace.json is structurally valid. However, two of the four test cases (MIDX-02 and MIDX-03) provide no real protection when the `plugins` array is empty, because their assertion bodies are never exercised. This is the most significant finding: the tests give false confidence that plugin entries will be validated. Additionally, the Prettier config runs against all project files including planning artifacts, and unused variables in the test file add minor noise.

## Critical Issues

### CR-01: Plugin entry validation tests never execute assertion bodies with empty plugins array

**File:** `tests/marketplace.test.js:53-73`
**Issue:** The tests "each plugin entry has name and source" (MIDX-02) and "plugin names are unique" (MIDX-03) trivially pass because `marketplace.plugins` is `[]`. The `for...of` loop on line 54 never enters its body, and the `map`/`filter` on line 65 produces an empty array. This means these tests assert nothing about actual plugin entries. When Phase 2 adds the first plugin entry, a malformed entry (missing `source`, duplicate `name`) could pass these tests if the tests are not updated.

The core problem: MIDX-02 and MIDX-03 requirements are listed as "completed" in SUMMARY.md but the corresponding tests provide zero protection. The schema validation test (CR-01/MIDX-01) does catch structural issues via AJV, but the custom uniqueness check (MIDX-03) and field-presence check (MIDX-02) are dead code paths.

**Fix:** Add a test guard that asserts the plugins array is non-empty, or add a separate test that validates the test logic by constructing a known-bad input and asserting it fails. For example:

```javascript
it("each plugin entry has name and source", () => {
  // Guard: ensure test exercises its assertions when plugins are added
  if (marketplace.plugins.length === 0) {
    // Phase 1: empty marketplace is acceptable, but log a warning
    console.warn(
      "MIDX-02: plugins array is empty -- field checks not exercised"
    );
    return;
  }
  for (const plugin of marketplace.plugins) {
    expect(plugin).toHaveProperty("name");
    expect(typeof plugin.name).toBe("string");
    expect(plugin.name.length).toBeGreaterThan(0);
    expect(plugin).toHaveProperty("source");
    expect(plugin.source).toBeDefined();
  }
});
```

Alternatively, add a dedicated test with a synthetic malformed plugin to prove the validation logic works:

```javascript
it("rejects plugin entries without name or source", () => {
  const badPlugins = [
    { source: { source: "url", url: "https://example.com" } }, // missing name
    { name: "test-plugin" }, // missing source
  ];
  for (const plugin of badPlugins) {
    const valid = validate({ ...marketplace, plugins: [plugin] });
    expect(valid).toBe(false);
  }
});
```

## Warnings

### WR-01: Prettier scripts scan all project files including planning artifacts

**File:** `package.json:7-8`
**Issue:** The `format` and `format:check` scripts use `prettier --write .` and `prettier --check .` which recursively scan all files including `.planning/` directory. Running `npx prettier --check .` reports 17 unformatted files, all in `.planning/` and `CLAUDE.md`. This creates noise and risks accidentally reformatting planning artifacts.

**Fix:** Add a `.prettierignore` file to exclude non-source paths, or scope the Prettier scripts:

```json
"format": "prettier --write '.claude-plugin/**/*.json' 'tests/**/*.js' 'tests/**/*.json' 'package.json' '.prettierrc'",
"format:check": "prettier --check '.claude-plugin/**/*.json' 'tests/**/*.js' 'tests/**/*.json' 'package.json' '.prettierrc'"
```

Or create a `.prettierignore`:

```
.planning/
CLAUDE.md
```

### WR-02: Plugin source field validation only checks existence, not type or structure

**File:** `tests/marketplace.test.js:59-60`
**Issue:** The test `expect(plugin.source).toBeDefined()` only asserts that `source` is not `undefined`. Per the official schema (line 1770-1890 of marketplace.schema.json), `source` must be one of: a relative path string, an npm object, a url object, a github object, or a git-subdir object. A value of `null`, `0`, `false`, or `{}` would pass this test. The schema validation test (test 1) would catch this for the actual marketplace.json, but the MIDX-02 test gives a misleading sense of coverage.

**Fix:** Strengthen the assertion to check type:

```javascript
expect(plugin).toHaveProperty("source");
expect(
  typeof plugin.source === "string" || typeof plugin.source === "object"
).toBe(true);
expect(plugin.source).not.toBeNull();
```

## Info

### IN-01: Unused variables in test file

**File:** `tests/marketplace.test.js:12`
**Issue:** The `ajv` and `schema` variables are assigned in `beforeAll` but never referenced outside it. Only `validate` and `marketplace` are used in the test cases.

**Fix:** Remove unused variables or keep `schema` if it may be used for future tests. Minimal change:

```javascript
let validate, marketplace;
```

Then in `beforeAll`:

```javascript
const ajv = new Ajv({ strict: true });
addFormats(ajv);
const schema = JSON.parse(readFileSync(...));
validate = ajv.compile(schema);
```

### IN-02: .gitignore includes .claude/ which could be confused with .claude-plugin/

**File:** `.gitignore:4`
**Issue:** The `.gitignore` entry `.claude/` ignores Claude Code's working directory. This is correct behavior, but the naming similarity with `.claude-plugin/` (the core deliverable directory) could cause confusion for contributors. Not a bug -- git matches exact directory names -- but worth a comment in the file for clarity.

**Fix:** Add a clarifying comment:

```
node_modules
coverage
.DS_Store
.claude/          # Claude Code working directory (NOT .claude-plugin/)
```

---

_Reviewed: 2026-05-22T14:24:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
