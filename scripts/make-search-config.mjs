// Builds Aurelia's curated search-config-v2 dump from the Firefox original.
// Keeps privacy-respecting generalists (visible in all regions) plus the
// locale-specific Wikipedia entries; DuckDuckGo becomes the global default.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// pristine Firefox dump, kept in-repo (engine/'s copy gets overwritten by
// our own overlay on import, so never read from there)
const srcPath = join(root, "scripts", "data", "search-config-v2.orig.json");
const outPath = join(root, "src", "services", "settings", "dumps", "main", "search-config-v2.json");

const KEEP = new Set(["ddg", "startpage", "ecosia", "qwant", "google"]);

const dump = JSON.parse(readFileSync(srcPath, "utf8"));

// drop Mozilla partner/affiliate codes from engine URLs
function stripPartnerCode(engine) {
  delete engine.base.partnerCode;
  for (const url of Object.values(engine.base.urls ?? {})) {
    if (Array.isArray(url.params)) {
      url.params = url.params.filter(
        p => !String(p.value ?? "").includes("{partnerCode}")
      );
      if (!url.params.length) delete url.params;
    }
  }
  for (const variant of engine.variants ?? []) {
    delete variant.partnerCode;
    delete variant.telemetrySuffix;
  }
}

const braveRecord = {
  recordType: "engine",
  identifier: "brave",
  id: "aurelia-brave-search-0001",
  last_modified: 1,
  schema: 1,
  base: {
    aliases: ["brave"],
    classification: "general",
    name: "Brave Search",
    urls: {
      search: {
        base: "https://search.brave.com/search",
        searchTermParamName: "q",
      },
      suggestions: {
        base: "https://search.brave.com/api/suggest",
        searchTermParamName: "q",
      },
    },
  },
  variants: [{ environment: { allRegions: true } }],
};

dump.data = dump.data.flatMap(record => {
  if (record.recordType === "engine") {
    const id = record.identifier;
    if (KEEP.has(id)) {
      // generalists become available everywhere, without affiliate tags
      record.variants = [{ environment: { allRegions: true } }];
      stripPartnerCode(record);
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

dump.data.push(braveRecord);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(dump, null, 2) + "\n");
console.log(`search-config-v2: ${dump.data.length} records written to ${outPath}`);
