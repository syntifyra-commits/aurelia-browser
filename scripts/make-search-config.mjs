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

// RemoteSettingsClient only re-imports a packaged dump into an existing
// profile when its timestamp is NEWER than the copy already in IndexedDB —
// and sync can never refresh these collections (dump-only patch). So every
// regeneration must advance the changeset timestamp, and the records we
// rewrite carry it as their last_modified.
const stamp = Date.now();
dump.timestamp = stamp;

// drop Mozilla partner/affiliate codes from engine URLs — both the
// {partnerCode} template params and codes baked directly into a base URL's
// query string (e.g. Startpage's suggestions "?partner=apex")
function stripPartnerCode(engine) {
  delete engine.base.partnerCode;
  for (const url of Object.values(engine.base.urls ?? {})) {
    if (Array.isArray(url.params)) {
      url.params = url.params.filter(
        p => !String(p.value ?? "").includes("{partnerCode}")
      );
      if (!url.params.length) delete url.params;
    }
    if (typeof url.base === "string" && url.base.includes("?")) {
      const [origin, query] = url.base.split("?");
      const params = new URLSearchParams(query);
      params.delete("partner");
      const rest = params.toString();
      url.base = rest ? `${origin}?${rest}` : origin;
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
  last_modified: stamp,
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
  variants: [{ environment: { allRegionsAndLocales: true } }],
};

dump.data = dump.data.flatMap(record => {
  if (record.recordType === "engine") {
    const id = record.identifier;
    if (KEEP.has(id)) {
      // generalists become available everywhere, without affiliate tags
      record.variants = [{ environment: { allRegionsAndLocales: true } }];
      stripPartnerCode(record);
      record.last_modified = stamp;
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
    record.last_modified = stamp;
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
