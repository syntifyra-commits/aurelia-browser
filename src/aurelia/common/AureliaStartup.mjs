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
      console.log("Aurelia: debug shot written to", path);
    } catch (e) {
      console.error("Aurelia: debug shot failed", e);
    }
  }, delay);
}

function onWindowReady() {
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
