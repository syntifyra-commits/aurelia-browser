// Builds Aurelia's curated search-config-v2 dump from the Firefox original.
// Keeps privacy-respecting generalists (visible in all regions) plus the
// locale-specific Wikipedia entries; DuckDuckGo becomes the global default.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = join(root, "engine", "services", "settings", "dumps", "main", "search-config-v2.json");
const outPath = join(root, "src", "services", "settings", "dumps", "main", "search-config-v2.json");

const KEEP = new Set(["ddg", "startpage", "ecosia", "qwant"]);

const dump = JSON.parse(readFileSync(srcPath, "utf8"));

dump.data = dump.data.flatMap(record => {
  if (record.recordType === "engine") {
    const id = record.identifier;
    if (KEEP.has(id)) {
      // generalists become available everywhere
      record.variants = [{ environment: { allRegions: true } }];
      return [record];
    }
    if (id.startsWith("wikipedia")) {
      return [record];
    }
    return [];
  }
  if (record.recordType === "defaultEngines") {
    record.globalDefault = "ddg";
    record.globalDefaultPrivate = "ddg";
    record.specificDefaults = [];
    return [record];
  }
  if (record.recordType === "engineOrders") {
    return []; // deterministic default ordering
  }
  return [record]; // availableLocales etc.
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(dump, null, 2) + "\n");
console.log(`search-config-v2: ${dump.data.length} records written to ${outPath}`);
