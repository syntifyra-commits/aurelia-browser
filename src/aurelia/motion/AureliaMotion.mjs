/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Sets a per-popup transform origin so panels and menus grow out of their
 * anchor instead of popping in. All actual animation lives in
 * aurelia-motion.css; this module only feeds it --au-origin. */

const ORIGINS = {
  after_start: "top left",
  after_end: "top right",
  before_start: "bottom left",
  before_end: "bottom right",
  start_before: "right top",
  start_after: "right bottom",
  end_before: "left top",
  end_after: "left bottom",
  overlap: "top left",
};

export const AureliaMotion = {
  init(win) {
    win.addEventListener("popupshowing", this, true);
  },

  handleEvent(event) {
    const popup = event.target;
    if (!popup?.localName) {
      return;
    }
    if (popup.localName !== "panel" && popup.localName !== "menupopup") {
      return;
    }
    const origin = ORIGINS[popup.alignmentPosition] ?? "top left";
    popup.style.setProperty("--au-origin", origin);
  },
};
