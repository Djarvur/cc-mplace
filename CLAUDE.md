<!-- GSD:project-start source:PROJECT.md -->

## Project

**Claude Code Plugin Marketplace**

A static plugin registry for Claude Code. Plugin authors submit PRs with their plugin metadata; CI validates entries; a single JSON index file is hosted at a raw GitHub URL. Users add the marketplace source with `claude plugin marketplace add` and install plugins with `claude plugin install <name>`.

**Core Value:** Plugins are discoverable and installable via Claude Code CLI commands — no manual cloning, config editing, or guessing.

### Constraints

- **Hosting**: Raw GitHub URL — zero infrastructure, just reference the main branch file
- **Index format**: Single JSON file — one HTTP fetch gets the full catalog
- **Publishing**: PR-based — authors fork, add entry, open PR against this repo
- **Namespace**: Djarvur-only initially — single-author curates all entries
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Key Discovery

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

## Sources

- https://code.claude.com/docs/en/plugin-marketplaces
- https://code.claude.com/docs/en/plugins-reference
- https://github.com/anthropics/claude-plugins-official
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.

<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
