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
