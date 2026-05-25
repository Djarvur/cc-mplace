import { describe, it, expect, beforeAll } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("marketplace.json", () => {
  let ajv, schema, validate, marketplace;

  beforeAll(() => {
    ajv = new Ajv({ strict: true });
    addFormats(ajv);
    schema = JSON.parse(
      readFileSync(
        resolve(__dirname, "schemas", "marketplace.schema.json"),
        "utf-8"
      )
    );
    validate = ajv.compile(schema);
    marketplace = JSON.parse(
      readFileSync(
        resolve(__dirname, "..", ".claude-plugin", "marketplace.json"),
        "utf-8"
      )
    );
  });

  it("validates against the official JSON Schema", () => {
    const valid = validate(marketplace);
    if (!valid) {
      console.error("Schema validation errors:", validate.errors);
    }
    expect(valid).toBe(true);
  });

  it("has required top-level fields with correct types", () => {
    expect(marketplace).toHaveProperty("name");
    expect(typeof marketplace.name).toBe("string");
    expect(marketplace.name.length).toBeGreaterThan(0);

    expect(marketplace).toHaveProperty("owner");
    expect(typeof marketplace.owner).toBe("object");
    expect(marketplace.owner).toHaveProperty("name");

    expect(marketplace).toHaveProperty("plugins");
    expect(Array.isArray(marketplace.plugins)).toBe(true);
  });

  it("each plugin entry has name and source", () => {
    for (const plugin of marketplace.plugins) {
      expect(plugin).toHaveProperty("name");
      expect(typeof plugin.name).toBe("string");
      expect(plugin.name.length).toBeGreaterThan(0);

      expect(plugin).toHaveProperty("source");
      expect(plugin.source).toBeDefined();
    }
  });

  it("plugin names are unique", () => {
    const names = marketplace.plugins.map((p) => p.name);
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index
    );
    expect(
      duplicates,
      `Duplicate plugin names: ${[...new Set(duplicates)].join(", ")}`
    ).toEqual([]);
  });

  it("cc-websearch entry has correct metadata", () => {
    expect(marketplace.plugins.length).toBeGreaterThanOrEqual(1);

    const entry = marketplace.plugins.find((p) => p.name === "cc-websearch");
    expect(entry, "cc-websearch plugin entry not found").toBeDefined();

    expect(entry.displayName).toBe("WebSearch");
    expect(entry.version).toBe("1.2.4");
    expect(entry.description).toContain("DDG-powered");

    expect(entry.source).toBeDefined();
    expect(entry.source.source).toBe("url");
    expect(entry.source.url).toBe(
      "https://github.com/Djarvur/cc-websearch.git"
    );

    expect(entry.author).toBeDefined();
    expect(entry.author.name).toBe("Djarvur");
    expect(entry.category).toBe("search");
  });
});
