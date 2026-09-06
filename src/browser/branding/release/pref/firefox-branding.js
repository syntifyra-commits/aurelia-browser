
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Aurelia branding prefs — replaces the surfer-generated file, which
 * hardcodes Zen Browser URLs. No first-run or what's-new pages, ever. */
pref("startup.homepage_override_url", "");
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");

// Give the user x seconds to react before showing the big UI. default=192 hours
pref("app.update.promptWaitTime", 691200);
pref("app.update.url.manual", "about:blank");
pref("app.update.url.details", "about:blank");
pref("app.releaseNotesURL", "about:blank");
pref("app.releaseNotesURL.aboutDialog", "about:blank");
pref("app.releaseNotesURL.prompt", "about:blank");

// Number of usages of the web console.
// If this is less than 5, then pasting code into the web console is disabled
pref("devtools.selfxss.count", 5);
