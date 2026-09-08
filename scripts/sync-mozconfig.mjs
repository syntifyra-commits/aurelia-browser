// Regenerates engine/mozconfig exactly the way surfer would. Surfer only
// writes that file inside `surfer build` (applyConfig, @zen-browser/surfer
// dist/commands/build.js:24-83), and that command is broken on native Windows
// because it spawns ./mach — so edits to configs/*/mozconfig silently never
// reach the engine (the build loop here is `npm run import` + `.\mach build`).
// This script replicates applyConfig byte-for-byte: same section order, same
// ${...} substitutions, same "Internal surfer config" tail, and the browser
// version.txt/version_display.txt writes that live in the same function.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const engineDir = join(root, "engine");

const config = JSON.parse(readFileSync(join(root, "surfer.json"), "utf8"));

// surfer persists `surfer set` state as .surfer/dynamicConfig.<key>.json
// (dist/utils/store.js:11-21) and falls back to these defaults
// (dist/utils/dynamic-config.js:8-12)
const dynamicDefaults = { brand: "unofficial", buildMode: "dev" };
function dynamicConfig(key) {
  const file = join(root, ".surfer", `dynamicConfig.${key}.json`);
  return existsSync(file)
    ? JSON.parse(readFileSync(file, "utf8"))
    : dynamicDefaults[key];
}

// dist/utils/string-template.js: replaces every literal ${key} occurrence
function stringTemplate(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split("${" + key + "}").join(String(value));
  }
  return result;
}

// dist/constants/mozconfig.js:7-62, verbatim (minus the darwin branch's
// getCurrentBrandName indirection, inlined from dist/commands/package.js:115-121)
function internalMozconfig(brand, buildMode) {
  const otherBuildModes = `# You can change to other build modes by running:
#   $ surfer set buildMode [dev|debug|release]`;
  let buildOptions = `# Unknown build mode ${buildMode}`;
  switch (buildMode) {
    case "dev": {
      buildOptions = `# Development build settings
${otherBuildModes}
ac_add_options --disable-debug`;
      break;
    }
    case "debug": {
      buildOptions = `# Debug build settings
${otherBuildModes}
ac_add_options --enable-debug
ac_add_options --disable-optimize`;
      break;
    }
    case "release": {
      buildOptions = `# Release build settings
ac_add_options --disable-debug
ac_add_options --enable-optimize
ac_add_options --enable-rust-simd`;
      break;
    }
  }
  // brand !== 'release' never uses version.candidate (dist/utils/version.js:22-33)
  const useCandidate =
    (brand !== "release" || process.env.SURFER_FORCE_CANDIDATE) &&
    config.version.candidate !== undefined &&
    config.version.version !== config.version.candidate;
  const ffVersion = useCandidate ? config.version.candidate : config.version.version;
  const brandName =
    brand === "unofficial" ? "Nightly" : config.brands[brand].brandShortName;
  return (
    `
# =====================
# Internal surfer config
# =====================

${buildOptions}

# Custom branding
ac_add_options --with-branding=browser/branding/${brand}

# Config for updates
ac_add_options --enable-update-channel=${brand}

export ACCEPTED_MAR_CHANNEL_IDS=${brand}
export MAR_CHANNEL_ID=${brand}

mk_add_options ACCEPTED_MAR_CHANNEL_IDS=${brand}

export ZEN_FIREFOX_VERSION=${ffVersion}
export MOZ_APPUPDATE_HOST=${config.updateHostname || "localhost:7648 # This should not resolve"}
` +
    (surferPlatform === "darwin"
      ? `

# MacOS specific settings
export MOZ_MACBUNDLE_NAME="${brandName}.app"
  `
      : "")
  );
}

// dist/index.js:5-11 — SURFER_PLATFORM overrides the host platform
const surferPlatform = process.env.SURFER_PLATFORM || process.platform;
const os = { win32: "windows", darwin: "macos", linux: "linux" }[surferPlatform];

const brand = dynamicConfig("brand");
const buildMode = dynamicConfig("buildMode");

// surfer runs `git rev-parse HEAD` in its own cwd, i.e. the PROJECT repo,
// not engine/ (dist/commands/build.js:30)
const changeset = execSync("git rev-parse HEAD", { cwd: root }).toString().trim();

// dist/commands/build.js:40-49 (vendor: config.name is surfer's own quirk)
const templateOptions = {
  name: config.name,
  vendor: config.name,
  appId: config.appId,
  brandingDir: existsSync(join(engineDir, "browser", "branding", brand))
    ? "browser/branding/" + brand
    : "browser/branding/unofficial",
  binName: config.binaryName,
  changeset,
};

const commonConfig = stringTemplate(
  readFileSync(join(root, "configs", "common", "mozconfig"), "utf8"),
  templateOptions
);
const osConfig = stringTemplate(
  readFileSync(join(root, "configs", os, "mozconfig"), "utf8"),
  templateOptions
);
// an uncommitted custom /mozconfig at the project root is honoured too
const customConfig = existsSync(join(root, "mozconfig"))
  ? stringTemplate(readFileSync(join(root, "mozconfig"), "utf8"), templateOptions)
  : "";

// dist/commands/build.js:58-66
const mergedConfig =
  `# This file is automatically generated. You should only modify this if you know what you are doing!\n\n` +
  commonConfig +
  "\n\n" +
  osConfig +
  "\n\n" +
  customConfig +
  "\n" +
  internalMozconfig(brand, buildMode);

const outPath = join(engineDir, "mozconfig");
const previous = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
writeFileSync(outPath, mergedConfig);

// dist/commands/build.js:76-82 — applyConfig also stamps the display version
const displayVersion = config.brands[brand]?.release?.displayVersion || "1.0.0";
writeFileSync(join(engineDir, "browser/config/version.txt"), displayVersion);
writeFileSync(join(engineDir, "browser/config/version_display.txt"), displayVersion);

if (previous === mergedConfig) {
  console.log(`sync-mozconfig: engine/mozconfig already up to date (${brand}/${buildMode}, ${changeset.slice(0, 12)})`);
} else {
  const before = previous.split("\n");
  const after = mergedConfig.split("\n");
  const removed = before.filter(line => !after.includes(line) && line.trim());
  const added = after.filter(line => !before.includes(line) && line.trim());
  console.log(`sync-mozconfig: wrote engine/mozconfig (brand=${brand}, buildMode=${buildMode}, changeset=${changeset.slice(0, 12)})`);
  for (const line of removed) console.log(`  - ${line}`);
  for (const line of added) console.log(`  + ${line}`);
}
