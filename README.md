# Claude Code Plugin Marketplace

A curated, static plugin registry for [Claude Code](https://code.claude.com). Add the marketplace, browse available plugins, and install them -- no manual cloning or config editing required.

## What is this?

This repository is a plugin marketplace for Claude Code. It hosts a single JSON index file that Claude Code reads to discover and install plugins. The registry is static -- no backend, no database, no build step. Plugin authors submit entries via pull request.

## Quick Start

### Add the marketplace

```bash
claude plugin marketplace add Djarvur/cc-mplace
```

### Install a plugin

```bash
claude plugin install <plugin-name>
```

For example, to install the web search plugin:

```bash
claude plugin install cc-websearch
```

### List installed plugins

```bash
claude plugin list
```

## Available Plugins

| Plugin       | Description                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- |
| cc-websearch | DDG-powered WebSearch and WebFetch replacement for Claude Code                           |
| go-ultimate  | Opinionated Go development skill — architecture, conventions, review, MCP/agent patterns |

## Multi-harness install

This marketplace is served in the [Claude Code](https://code.claude.com) format. The `go-ultimate` plugin ships first-party manifests for several other agents and is installed from its own repository, pinned to the same release tag (`v0.10.0`):

| Agent | Manifest in `Djarvur/go-ultimate` |
| ----- | --------------------------------- |
| Claude Code | `.claude-plugin/plugin.json` (via this marketplace, or clone directly) |
| Codex | `.codex-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` |
| Grok Build | `.grok-plugin/plugin.json` |
| Generic / OpenCode | `.plugin/plugin.json` |

To pin a specific version in any of these harnesses, check out the matching tag (`v0.10.0`) rather than `main`.

## Adding a Plugin

Plugins are added via pull request. Fork this repository, add an entry to `.claude-plugin/marketplace.json`, and open a PR. Entries are validated against the official Claude Code marketplace schema.

## License

All rights reserved.
