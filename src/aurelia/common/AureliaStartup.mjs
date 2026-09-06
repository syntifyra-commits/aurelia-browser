/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Per-window entry point for Aurelia chrome behaviour. Imported from
 * aurelia-preloaded.inc.xhtml into each browser window's global. */

import { AureliaMotion } from "chrome://browser/content/aurelia-components/AureliaMotion.mjs";
import { AureliaSetup } from "chrome://browser/content/aurelia-components/AureliaSetup.mjs";

const win = window;

function revealChrome() {
  win.document.documentElement.removeAttribute("aureliainit");
}

/* Dev instrument: AURELIA_SHOT=<path.png> renders this window via Gecko
 * (compositor-truthful for chrome; transparent areas show the fallback
 * color, not the OS backdrop). AURELIA_SHOT_DELAY overrides the wait. */
function maybeDebugShot() {
  let path;
  try {
    path = Services.env.get("AURELIA_SHOT");
  } catch {
    return;
  }
  if (!path) {
    return;
  }
  const delay = parseInt(Services.env.get("AURELIA_SHOT_DELAY") || "4000", 10);
  const open = Services.env.get("AURELIA_OPEN");
  if (open) {
    const ids = { setup: "aurelia-setup-button", menu: "PanelUI-menu-button" };
    win.setTimeout(() => {
      try {
        win.document.getElementById(ids[open] ?? open)?.click();
      } catch (e) {
        console.error("Aurelia: debug open failed", e);
      }
    }, Math.max(500, delay / 2));
  }
  win.setTimeout(() => {
    try {
      const c = win.document.createElementNS(
        "http://www.w3.org/1999/xhtml",
        "canvas"
      );
      c.width = win.innerWidth;
      c.height = win.innerHeight;
      const ctx = c.getContext("2d");
      ctx.drawWindow(win, 0, 0, c.width, c.height, "rgb(0,0,0)");
      const data = c.toDataURL("image/png").split(",")[1];
      IOUtils.write(path, Uint8Array.from(atob(data), ch => ch.charCodeAt(0)));
      console.log(
        "Aurelia: debug shot written to", path,
        "| policies:", Services.policies?.status,
        "| ETP:", Services.prefs.getCharPref("browser.contentblocking.category", "?"),
        "| telemetry:", Services.prefs.getBoolPref("toolkit.telemetry.enabled", true),
        "| trr:", Services.prefs.getIntPref("network.trr.mode", -1),
        "| fpp:", Services.prefs.getBoolPref("privacy.fingerprintingProtection", false)
      );
    } catch (e) {
      console.error("Aurelia: debug shot failed", e);
    }
  }, delay);
}

/* One-time profile stamping for choices Firefox derives at runtime and
 * would otherwise overwrite our defaults for (matchCBCategory writes
 * "standard" into fresh profiles because their driven prefs sit at
 * defaults). Setting the user value triggers ContentBlockingPrefs to
 * apply the full strict bundle, exactly like the Settings UI would. */
function ensureFirstRunDefaults() {
  try {
    if (Services.prefs.getBoolPref("aurelia.initialized", false)) {
      return;
    }
    Services.prefs.setBoolPref("aurelia.initialized", true);
    const { ContentBlockingPrefs } = ChromeUtils.importESModule(
      "moz-src:///browser/components/protections/ContentBlockingPrefs.sys.mjs"
    );
    if (!ContentBlockingPrefs.CATEGORY_PREFS) {
      ContentBlockingPrefs.setPrefExpectations();
    }
    ContentBlockingPrefs.setPrefsToCategory("strict");
    Services.prefs.setStringPref("browser.contentblocking.category", "strict");
  } catch (e) {
    console.error("Aurelia: first-run defaults failed", e);
  }
}

function onWindowReady() {
  ensureFirstRunDefaults();
  try {
    AureliaMotion.init(win);
  } catch (e) {
    console.error("Aurelia: motion init failed", e);
  }
  try {
    AureliaSetup.init(win);
  } catch (e) {
    console.error("Aurelia: setup init failed", e);
  }
  maybeDebugShot();
  // reveal after two frames so first paint happens fully styled
  win.requestAnimationFrame(() => win.requestAnimationFrame(revealChrome));
}

if (win.document.readyState === "complete") {
  onWindowReady();
} else {
  win.addEventListener("load", onWindowReady, { once: true });
}

// fail-safe: never leave the chrome hidden
win.setTimeout(revealChrome, 2000);
