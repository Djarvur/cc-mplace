# Stack Research: Claude Code Plugin Marketplace

**Researched:** 2026-05-22
**Confidence:** HIGH

## Key Discovery

Claude Code already has a native marketplace system. The registry format is `.claude-plugin/marketplace.json` at the repository root. The CLI natively supports `claude plugin marketplace add <owner>/<repo>` and `claude plugin install <name>@<marketplace>`. No custom format needed.

## Stack

| Component         | Choice                            | Version | Rationale                                                                         |
| ----------------- | --------------------------------- | ------- | --------------------------------------------------------------------------------- |
| Registry format   | `.claude-plugin/marketplace.json` | —       | Native Claude Code format, zero custom parsing                                    |
| Schema validation | AJV                               | 8.20.0  | Validates against published JSON Schema; Zod would require re-implementing schema |
| CLI validator     | `claude plugin validate .`        | —       | Official tool, checks schema + duplicate names + path traversal                   |
| CI platform       | GitHub Actions                    | —       | Native to GitHub, PR-based workflow                                               |
| Testing           | Vitest                            | 4.1.7   | For CI validation tests                                                           |
| Formatting        | Prettier                          | 3.x     | Consistent JSON formatting in CI                                                  |
| Hosting           | Raw GitHub URL                    | —       | `raw.githubusercontent.com` — zero infrastructure                                 |

## What NOT to Use

| Rejected                 | Why                                                                   |
| ------------------------ | --------------------------------------------------------------------- |
| Custom JSON index format | Claude Code has a native format — reinventing it breaks compatibility |
| Zod for validation       | Marketplace has a published JSON Schema; AJV validates directly       |
| Database / backend       | Static registry — CLI handles all dynamic behavior                    |
| GitHub Pages             | Raw URL is simpler, no build/deploy step                              |
| Custom CLI               | Claude Code CLI handles install, resolve, update, cache               |

## Reference Implementation

`anthropics/claude-plugins-official` — 20.9k stars, 100+ plugins, 2690-line marketplace.json. Canonical reference for marketplace structure.

## Sources

- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://github.com/anthropics/claude-plugins-official
