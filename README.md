# Djarvur Plugin Marketplace

A curated, static plugin registry for coding-agent hosts. Add the marketplace, browse available plugins, and install them -- no manual cloning or config editing required.

## What is this?

This repository is a plugin marketplace. It hosts a JSON index file per supported host that each host's CLI reads to discover and install plugins. The registry is static -- no backend, no database, no build step. Plugin authors submit entries via pull request.

Supported hosts: Claude Code, Codex, Grok Build, GitHub Copilot CLI. Each reads its native index file at a host-specific path (`.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, `.grok-plugin/marketplace.json`, `.github/plugin/marketplace.json`). Cursor cannot be served from a marketplace like this one — see [Cursor](#cursor).

## Quick Start

### Add the marketplace

| Host | Command |
|---|---|
| Claude Code | `claude plugin marketplace add Djarvur/cc-mplace` |
| Codex | `codex plugin marketplace add Djarvur/cc-mplace` |
| Grok Build | (install plugins directly, e.g. `grok plugin install 'Djarvur/cc-mplace#<plugin>' --trust`) |
| GitHub Copilot CLI | `copilot plugin marketplace add Djarvur/cc-mplace` |

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
| go-ultimate  | Opinionated Go development skill — architecture, conventions, review, MCP/agent patterns |

## Multi-harness install

This marketplace ships one index per host (see the paths listed above). The `go-ultimate` plugin ships first-party manifests for several other agents and is installed from its own repository:

| Agent | Manifest in `Djarvur/go-ultimate` |
| ----- | --------------------------------- |
| Claude Code | `.claude-plugin/plugin.json` (via this marketplace, or clone directly) |
| Codex | `.codex-plugin/plugin.json` |
| Cursor | `.cursor-plugin/plugin.json` (added straight from that repository, see [Cursor](#cursor)) |
| Grok Build | `.grok-plugin/plugin.json` |
| Generic / OpenCode | `.plugin/plugin.json` |

Every entry here is pinned to a release, with whatever mechanism its host supports. Claude Code and Codex pin the release tag (`"ref": "v0.12.0"`); Grok Build pins the full commit SHA that tag points at, which is the form its docs prescribe. The Copilot index carries no pin and resolves the plugin's default branch, so there the `version` field is metadata for display rather than a guarantee; to pin a version by hand, check out the matching tag. Cursor pins outside the index entirely, with `--git-ref` at the moment the plugin repository is added.

## Adding a Plugin

Plugins are added via pull request. Fork this repository, add an entry to **every** host's `marketplace.json` (`.claude-plugin/`, `.agents/plugins/`, `.grok-plugin/`, `.github/plugin/`), and open a PR. The Claude Code entry is validated against the official Claude Code marketplace schema. There is no Cursor index to add to; if your plugin ships a `.cursor-plugin/plugin.json`, document `agent plugin marketplace add <your repository>` in its own README.

## License

[MIT](LICENSE).

This covers the marketplace itself — the host indexes, the tests and the CI around them. It says nothing about the plugins listed here: each lives in its own repository and carries its own license.
