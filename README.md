# Djarvur Plugin Marketplace

A curated, static plugin registry for coding-agent hosts. Add the marketplace, browse available plugins, and install them -- no manual cloning or config editing required.

## What is this?

This repository is a plugin marketplace. It hosts a JSON index file per supported host that each host's CLI reads to discover and install plugins. The registry is static -- no backend, no database, no build step. Plugin authors submit entries via pull request.

Supported hosts: Claude Code, Codex, Grok Build, GitHub Copilot CLI, ZCode. Each reads its native index file at a host-specific path (`.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, `.grok-plugin/marketplace.json`, `.github/plugin/marketplace.json`) — ZCode reads the Claude Code index and manifests directly. Cursor cannot be served from a marketplace like this one — see [Cursor](#cursor). Hermes Agent has no marketplace protocol: install its skills from the plugin repositories directly, see [Hermes Agent](#hermes-agent).

## Quick Start

### Add the marketplace

| Host | Command |
|---|---|
| Claude Code | `claude plugin marketplace add Djarvur/cc-mplace` |
| Codex | `codex plugin marketplace add Djarvur/cc-mplace` |
| Grok Build | (install plugins directly, e.g. `grok plugin install 'Djarvur/cc-mplace#<plugin>' --trust`) |
| GitHub Copilot CLI | `copilot plugin marketplace add Djarvur/cc-mplace` |
| ZCode | `zcode plugins marketplace add Djarvur/cc-mplace` |

Cursor is not in that table on purpose: it installs from a plugin's own repository, not from here. See [Cursor](#cursor).

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

### Cursor

Cursor reads plugins from a plugin's own repository rather than from this marketplace:

```bash
agent plugin marketplace add https://github.com/Djarvur/go-ultimate.git --git-ref v0.12.0
```

Then install `go-ultimate` from `/plugins` in interactive mode, from the IDE, or from the dashboard. Cursor has no non-interactive install command. `--git-ref` takes a branch, tag or commit, and is where version pinning lives for this host.

Why not from here: a Cursor marketplace entry resolves its `source` as a directory path **inside the marketplace repository**, looking for `<source>/.cursor-plugin/plugin.json`. An entry naming a plugin's own repository resolves to nothing, and `agent plugin marketplace add` on this repository reports `No installable plugins found` without registering anything. Verified against `cursor-agent 2026.08.25`; see Djarvur/go-ultimate#41.

`cc-websearch` is not offered for Cursor. It works by denying the built-in `WebSearch`/`WebFetch` tools through Claude-format `PreToolUse` hooks so its skills take over, and Cursor has neither that hook schema nor those tools to deny.

## Available Plugins

| Plugin       | Description                                                                              |
| ------------ | ---------------------------------------------------------------------------------------- |
| cc-websearch | DDG-powered WebSearch and WebFetch replacement for Claude Code                           |
| go-ultimate  | Opinionated Go development skill — architecture, conventions, review, MCP/agent patterns — plus the vendored community skills: ponytail (minimal-change mode), ponytail-review, ponytail-audit, pr-simplify, test-audit, technical-documentation. See its README. |

## Multi-harness install

This marketplace ships one index per host (see the paths listed above). The `go-ultimate` plugin ships first-party manifests for several other agents and is installed from its own repository:

| Agent | Manifest in `Djarvur/go-ultimate` |
| ----- | --------------------------------- |
| Claude Code | `.claude-plugin/plugin.json` (via this marketplace, or clone directly) |
| Codex | `.codex-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` (added straight from that repository, see [Cursor](#cursor)) |
| Grok Build | `.grok-plugin/plugin.json` |
| Generic / OpenCode | `.plugin/plugin.json` |

Every entry here is pinned to a release, with whatever mechanism its host supports. Claude Code, Codex and GitHub Copilot CLI pin the release tag (`"ref": "v0.12.0"`); Grok Build pins the full commit SHA that tag points at, which is the form its docs prescribe. Cursor pins outside the index entirely, with `--git-ref` at the moment the plugin repository is added.

### ZCode

ZCode shares Claude Code's plugin infrastructure: it reads the same marketplace index (`.claude-plugin/marketplace.json`) and resolves plugin manifests at `.zcode-plugin/plugin.json` first, then `.claude-plugin/plugin.json`. A plugin that ships a Claude manifest installs with no extra work:

```bash
zcode plugins marketplace add Djarvur/cc-mplace
zcode plugins install go-ultimate
```

### Hermes Agent

Hermes Agent has no marketplace protocol, so it installs skills from the plugin repositories directly:

```bash
hermes skills install https://raw.githubusercontent.com/Djarvur/go-ultimate/v0.13.0/skills/go-ultimate/SKILL.md
```

or add a plugin repository as a skill tap (browsable + updatable):

```bash
hermes skills tap add Djarvur/go-ultimate
```

## Adding a Plugin

Plugins are added via pull request. Fork this repository, add an entry to **every** host's `marketplace.json` (`.claude-plugin/`, `.agents/plugins/`, `.grok-plugin/`, `.github/plugin/`), and open a PR. The Claude Code entry is validated against the official Claude Code marketplace schema. There is no Cursor index to add to; if your plugin ships a `.cursor-plugin/plugin.json`, document `agent plugin marketplace add <your repository>` in its own README.

## License

[MIT](LICENSE).

This covers the marketplace itself — the host indexes, the tests and the CI around them. It says nothing about the plugins listed here: each lives in its own repository and carries its own license.
