import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Every supported host reads its own index file. An entry added or bumped in
// one index but not the others silently ships a stale version to those hosts,
// which is how go-ultimate ended up at 0.10.0 for Claude Code and 0.4.1
// everywhere else.
const HOST_INDEXES = {
  "claude-code": ".claude-plugin/marketplace.json",
  codex: ".agents/plugins/marketplace.json",
  cursor: ".cursor-plugin/marketplace.json",
  grok: ".grok-plugin/marketplace.json",
  copilot: ".github/plugin/marketplace.json",
};

describe("host indexes", () => {
  let indexes;

  beforeAll(() => {
    indexes = Object.fromEntries(
      Object.entries(HOST_INDEXES).map(([host, path]) => [
        host,
        JSON.parse(readFileSync(resolve(__dirname, "..", path), "utf-8")),
      ])
    );
  });

  it("every host index lists the same plugins", () => {
    const [reference, ...rest] = Object.keys(HOST_INDEXES);
    const expected = indexes[reference].plugins.map((p) => p.name).sort();

    for (const host of rest) {
      const names = indexes[host].plugins.map((p) => p.name).sort();
      expect(
        names,
        `${HOST_INDEXES[host]} lists different plugins than ${HOST_INDEXES[reference]}`
      ).toEqual(expected);
    }
  });

  // Descriptions are deliberately host-tailored, so only versions are compared.
  it("every plugin declares the same version in each index", () => {
    const [reference, ...rest] = Object.keys(HOST_INDEXES);

    for (const plugin of indexes[reference].plugins) {
      for (const host of rest) {
        const entry = indexes[host].plugins.find((p) => p.name === plugin.name);
        expect(
          entry.version,
          `${plugin.name}: ${HOST_INDEXES[host]} declares ${entry.version}, ${HOST_INDEXES[reference]} declares ${plugin.version}`
        ).toBe(plugin.version);
      }
    }
  });

  it("a pinned ref matches the declared version", () => {
    for (const [host, path] of Object.entries(HOST_INDEXES)) {
      for (const plugin of indexes[host].plugins) {
        const ref = plugin.source?.ref;
        if (!ref) continue;

        expect(
          ref,
          `${plugin.name}: ${path} pins ${ref} but declares version ${plugin.version}`
        ).toBe(`v${plugin.version}`);
      }
    }
  });

  // Grok pins by commit SHA rather than by ref, so a SHA cannot be checked
  // against the declared version offline. What it must do is agree with every
  // other index pinning the same plugin.
  it("a pinned sha is a full commit sha and agrees across indexes", () => {
    const seen = new Map();

    for (const [host, path] of Object.entries(HOST_INDEXES)) {
      for (const plugin of indexes[host].plugins) {
        const sha = plugin.source?.sha;
        if (!sha) continue;

        expect(sha, `${plugin.name}: ${path} pins a partial sha`).toMatch(
          /^[0-9a-f]{40}$/
        );

        const previous = seen.get(plugin.name);
        if (previous) {
          expect(
            sha,
            `${plugin.name}: ${path} pins ${sha}, ${previous.path} pins ${previous.sha}`
          ).toBe(previous.sha);
        } else {
          seen.set(plugin.name, { sha, path });
        }
      }
    }
  });
});
