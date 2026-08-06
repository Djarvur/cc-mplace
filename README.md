# Djarvur Plugin Marketplace

A curated, static plugin registry for coding-agent hosts. Add the marketplace, browse available plugins, and install them -- no manual cloning or config editing required.

## What is this?

This repository is a plugin marketplace. It hosts a JSON index file per supported host that each host's CLI reads to discover and install plugins. The registry is static -- no backend, no database, no build step. Plugin authors submit entries via pull request.

Supported hosts: Claude Code, Codex, Cursor, Grok Build, GitHub Copilot CLI. Each reads its native index file at a host-specific path (`.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, `.cursor-plugin/marketplace.json`, `.grok-plugin/marketplace.json`, `.github/plugin/marketplace.json`).

## Quick Start

### Add the marketplace

| Host | Command |
|---|---|
| Claude Code | `claude plugin marketplace add Djarvur/cc-mplace` |
| Codex | `codex plugin marketplace add Djarvur/cc-mplace` |
| Cursor | `agent plugin marketplace add https://github.com/Djarvur/cc-mplace.git` |
| Grok Build | (install plugins directly, e.g. `grok plugin install 'Djarvur/cc-mplace#<plugin>' --trust`) |
| GitHub Copilot CLI | `copilot plugin marketplace add Djarvur/cc-mplace` |

### Install a plugin

```bash
<host> plugin install <plugin-name>
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

## Adding a Plugin

Plugins are added via pull request. Fork this repository, add an entry to **every** host's `marketplace.json` (`.claude-plugin/`, `.agents/plugins/`, `.cursor-plugin/`, `.grok-plugin/`, `.github/plugin/`), and open a PR. The Claude Code entry is validated against the official Claude Code marketplace schema.

## License

All rights reserved.
