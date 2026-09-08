/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Fail-safe registered BEFORE the import: if anything in the startup module
// chain fails to load, nothing else would ever lift the FOUC guard and the
// chrome would stay at opacity 0 forever.
setTimeout(() => document.documentElement.removeAttribute("aureliainit"), 2000);

try {
  ChromeUtils.importESModule(
    "chrome://browser/content/aurelia-components/AureliaStartup.mjs",
    { global: "current" }
  );
} catch (e) {
  console.error("Aurelia: startup module failed to load", e);
  document.documentElement.removeAttribute("aureliainit");
}
