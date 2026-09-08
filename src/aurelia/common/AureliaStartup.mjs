/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Per-window entry point for Aurelia chrome behaviour. Imported from
 * aurelia-preloaded.inc.xhtml into each browser window's global. */

import { AureliaMotion } from "chrome://browser/content/aurelia-components/AureliaMotion.mjs";
import { AureliaSetup } from "chrome://browser/content/aurelia-components/AureliaSetup.mjs";

const win = window;

const PROFILE_STAMP = 3;
const SPLASH_MIN_MS = 1600;

function revealChrome() {
  win.document.documentElement.removeAttribute("aureliainit");
}

/* One-time profile stamping for state Firefox derives at runtime and would
 * otherwise overwrite our defaults for. v1: ETP strict (matchCBCategory
 * matches fresh profiles to "standard"). v2: purge the synced copy of the
 * search configuration so the curated dump (DDG default, Brave, Google,
 * no affiliate tags) wins over what Mozilla's server pushed earlier. */
async function ensureProfileStamp() {
  let current = Services.prefs.getIntPref("aurelia.stamp", 0);
  if (!current && Services.prefs.getBoolPref("aurelia.initialized", false)) {
    current = 1;
  }
  if (current >= PROFILE_STAMP) {
    return;
  }
  Services.prefs.setIntPref("aurelia.stamp", PROFILE_STAMP);
  Services.prefs.setBoolPref("aurelia.initialized", true);

  if (current < 1) {
    try {
      const { ContentBlockingPrefs } = ChromeUtils.importESModule(
        "moz-src:///browser/components/protections/ContentBlockingPrefs.sys.mjs"
      );
      if (!ContentBlockingPrefs.CATEGORY_PREFS) {
        ContentBlockingPrefs.setPrefExpectations();
      }
      ContentBlockingPrefs.setPrefsToCategory("strict");
      Services.prefs.setStringPref(
        "browser.contentblocking.category",
        "strict"
      );
    } catch (e) {
      console.error("Aurelia: strict stamping failed", e);
    }
  }

  if (current < 2) {
    try {
      const { RemoteSettings } = ChromeUtils.importESModule(
        "resource://services-settings/remote-settings.sys.mjs"
      );
      const client = RemoteSettings("search-config-v2");
      await client.db.clear();
      const records = await client.get(); // falls back to the packaged dump
      await client.emit("sync", { data: { current: records } });
      console.log("Aurelia: search configuration refreshed from dump");
    } catch (e) {
      console.error("Aurelia: search config refresh failed", e);
    }
  }

  // v3: drop a firefox-view-button placement carried over from pre-Aurelia
  // profiles. One-time on purpose — a user who re-adds the button in
  // Customize mode afterwards keeps it (FF155 has no kill pref; the menubar
  // entry is hidden in CSS).
  if (current < 3) {
    try {
      const { CustomizableUI } = ChromeUtils.importESModule(
        "moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs"
      );
      CustomizableUI.removeWidgetFromArea("firefox-view-button");
    } catch (e) {
      console.error("Aurelia: firefox-view cleanup failed", e);
    }
  }
}

/* Startup reveal: the Aurelia monogram draws itself in gold over an opaque
 * sheet, then the chrome fades through. First window of the session only;
 * any input skips it; slow starts get a shimmer bar. */
function isFirstBrowserWindow() {
  let count = 0;
  for (const _ of Services.wm.getEnumerator("navigator:browser")) {
    count++;
  }
  return count <= 1;
}

/* Returns the ms until the veil starts its leave fade (0 = no splash), so
 * followers like the onboarding can wait for the actual teardown. */
function showSplash() {
  try {
    if (!Services.prefs.getBoolPref("aurelia.startup.animation", true)) {
      return 0;
    }
    if (win.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return 0;
    }
    if (!isFirstBrowserWindow()) {
      return 0;
    }
    const doc = win.document;
    const overlay = doc.createElement("div");
    overlay.id = "aurelia-splash";
    const slow = win.performance.now() > 2500;
    overlay.innerHTML = `
      <div class="au-splash-stack">
        <svg class="au-splash-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
          <defs>
            <linearGradient id="au-splash-gold" gradientUnits="userSpaceOnUse" x1="512" y1="262" x2="512" y2="738">
              <stop offset="0" stop-color="#efdcac"></stop>
              <stop offset="0.55" stop-color="#d8b26e"></stop>
              <stop offset="1" stop-color="#c09a56"></stop>
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#au-splash-gold)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round">
            <path class="au-splash-a" d="M 356 738 L 512 262 L 668 738"></path>
            <path class="au-splash-crossbar" d="M 408 584 L 616 584"></path>
          </g>
        </svg>
        <div class="au-splash-word">Aurelia</div>
        ${slow ? '<div class="au-splash-loading"><div class="au-splash-runner"></div></div>' : ""}
      </div>`;
    // top layer via manual popover: the breakout urlbar is itself a popover
    // and would beat any z-index
    overlay.setAttribute("popover", "manual");
    // the resting urlbar lives in the top layer too and escapes both the
    // toolbox opacity and our popover order — hide it while the veil is up
    doc.documentElement.setAttribute("aurelia-splash", "true");
    doc.documentElement.appendChild(overlay);
    try {
      overlay.showPopover();
    } catch (e) {
      console.error("Aurelia: splash popover failed", e);
    }

    const finish = () => {
      if (!overlay.isConnected || overlay.classList.contains("au-splash-leave")) {
        return;
      }
      overlay.classList.add("au-splash-leave");
      doc.documentElement.removeAttribute("aurelia-splash");
      win.setTimeout(() => overlay.remove(), 600);
    };
    overlay.addEventListener("pointerdown", finish);
    win.addEventListener("keydown", finish, { once: true, capture: true });
    const finishAt = slow ? SPLASH_MIN_MS + 900 : SPLASH_MIN_MS;
    win.setTimeout(finish, finishAt);
    win.setTimeout(() => {
      doc.documentElement.removeAttribute("aurelia-splash");
      overlay.remove();
    }, 6000); // hard failsafe
    return finishAt;
  } catch (e) {
    console.error("Aurelia: splash failed", e);
    return 0;
  }
}

/* Optional first-run onboarding: opens the Setup panel once, with a welcome
 * header. Closing the panel is skipping — it never comes back (done stamp);
 * aurelia.onboarding.enabled=false suppresses it entirely. */
function maybeOnboard(splashFinishAt) {
  try {
    if (!Services.prefs.getBoolPref("aurelia.onboarding.enabled", true)) {
      return;
    }
    if (Services.prefs.getBoolPref("aurelia.onboarding.done", false)) {
      return;
    }
    if (!isFirstBrowserWindow()) {
      return;
    }
    // wait for the veil's leave fade (450ms) plus a beat of quiet
    const delay = splashFinishAt ? splashFinishAt + 650 : 800;
    win.setTimeout(() => {
      try {
        Services.prefs.setBoolPref("aurelia.onboarding.done", true);
        AureliaSetup.beginOnboarding(win);
      } catch (e) {
        console.error("Aurelia: onboarding failed", e);
      }
    }, delay);
  } catch (e) {
    console.error("Aurelia: onboarding failed", e);
  }
}

/* www. fallback: Firefox fixes a bare "example.com" up to the apex host and
 * never retries it — sites that only serve www. then hit an error page.
 * When a top-level http(s) load of an apex host (no subdomain) fails with a
 * DNS or connection-refused error, retry once with www. prepended. Loop-free
 * by construction: www.<host> has a subdomain, so it never qualifies again.
 * Pref: aurelia.urlbar.wwwFallback. */
const WWW_RETRY_ERRORS = new Set([
  Cr.NS_ERROR_UNKNOWN_HOST,
  Cr.NS_ERROR_CONNECTION_REFUSED,
]);

function initWwwFallback() {
  const gBrowser = win.gBrowser;
  if (!gBrowser) {
    return;
  }
  const { STATE_STOP, STATE_IS_NETWORK } = Ci.nsIWebProgressListener;
  gBrowser.addTabsProgressListener({
    onStateChange(browser, webProgress, request, stateFlags, status) {
      try {
        if (!(stateFlags & STATE_STOP) || !(stateFlags & STATE_IS_NETWORK)) {
          return;
        }
        if (!WWW_RETRY_ERRORS.has(status) || !webProgress?.isTopLevel) {
          return;
        }
        if (!Services.prefs.getBoolPref("aurelia.urlbar.wwwFallback", true)) {
          return;
        }
        if (!(request instanceof Ci.nsIChannel)) {
          return;
        }
        const uri = request.URI;
        if (!uri || (uri.scheme !== "http" && uri.scheme !== "https")) {
          return;
        }
        const host = uri.host;
        if (!host || host.startsWith("www.")) {
          return;
        }
        let base;
        try {
          base = Services.eTLD.getBaseDomainFromHost(host);
        } catch {
          return; // IP literal or single-label host — nothing to prepend to
        }
        if (base !== host) {
          return; // already has a subdomain
        }
        const www = uri.mutate().setHost(`www.${host}`).finalize();
        browser.fixupAndLoadURIString(www.spec, {
          triggeringPrincipal:
            Services.scriptSecurityManager.getSystemPrincipal(),
        });
      } catch (e) {
        console.error("Aurelia: www fallback failed", e);
      }
    },
  });
}

/* Dev instrument: AURELIA_SHOT=<path.png> renders this window via Gecko.
 * AURELIA_OPEN=setup|menu|urlbar|maximize drives UI for captures. */
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
        if (open === "urlbar") {
          win.gURLBar.focus();
          win.gURLBar.search("hello world");
          return;
        }
        if (open === "maximize") {
          win.maximize();
          return;
        }
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
      const { SearchService } = ChromeUtils.importESModule(
        "moz-src:///toolkit/components/search/SearchService.sys.mjs"
      );
      SearchService.getVisibleEngines().then(engines =>
        console.log("Aurelia: engines:", engines.map(e => e.name).join(", "))
      );
    } catch (e) {
      console.error("Aurelia: debug shot failed", e);
    }
  }, delay);
}

function onWindowReady() {
  ensureProfileStamp().catch(console.error);
  const splashFinishAt = showSplash();
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
  try {
    initWwwFallback();
  } catch (e) {
    console.error("Aurelia: www fallback init failed", e);
  }
  maybeOnboard(splashFinishAt);
  maybeDebugShot();
  // dev self-test: AURELIA_TEST_HARDENED=1 round-trips the arkenfox toggle
  try {
    if (Services.env.get("AURELIA_TEST_HARDENED")) {
      win.setTimeout(() => {
        AureliaSetup.applyPrivacy(2);
        console.log(
          "AURELIA-TEST hardened rfp:",
          Services.prefs.getBoolPref("privacy.resistFingerprinting", false),
          "| https-only:",
          Services.prefs.getBoolPref("dom.security.https_only_mode", false)
        );
        AureliaSetup.applyPrivacy(1);
        console.log(
          "AURELIA-TEST standard rfp:",
          Services.prefs.getBoolPref("privacy.resistFingerprinting", false),
          "| ETP:",
          Services.prefs.getCharPref("browser.contentblocking.category", "?")
        );
      }, 3000);
    }
  } catch {}
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
