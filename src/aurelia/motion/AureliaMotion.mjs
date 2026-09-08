/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Feeds aurelia-motion.css: sets a per-popup transform origin so panels and
 * menus grow out of their anchor, and stamps [au-open] on menupopups so
 * their entry keyframes replay per open (popup frames persist while closed,
 * so an unconditional animation would run once per window, ever). */

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
  lastPointer: null,

  init(win) {
    // Arrow panels: FF155 exposes the resolved alignment only on the
    // popuppositioned event (fires for type="arrow" panels ONLY).
    win.addEventListener("popuppositioned", this, true);
    // Menus: stamp [au-open] + derive the origin from geometry.
    win.addEventListener("popupshowing", this, true);
    win.addEventListener("popuphidden", this, true);
    // Context menus open at the pointer — remember where that was.
    win.addEventListener("contextmenu", this, true);
    // Animated tab opens get [fadein] a frame AFTER insertion; session-
    // restore/skipAnimation tabs carry it synchronously from the start.
    // Stamp only the former, so open flair never plays 40× during restore.
    win.addEventListener("TabOpen", event => {
      const tab = event.target;
      if (!tab.hasAttribute("fadein")) {
        tab.setAttribute("au-animate-open", "true");
      }
    });
  },

  motionActive(win) {
    return (
      Services.prefs.getBoolPref("aurelia.motion.enabled", true) &&
      !win.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  },

  handleEvent(event) {
    switch (event.type) {
      case "contextmenu":
        this.lastPointer = { x: event.screenX, y: event.screenY };
        break;
      case "popuppositioned": {
        const popup = event.target;
        if (popup?.localName !== "panel") {
          break;
        }
        if (!this.motionActive(popup.ownerGlobal)) {
          break;
        }
        const origin = ORIGINS[event.alignmentPosition] ?? "top left";
        if (popup.style.getPropertyValue("--au-origin") !== origin) {
          popup.style.setProperty("--au-origin", origin);
        }
        break;
      }
      case "popupshowing": {
        const popup = event.target;
        if (popup?.localName !== "menupopup") {
          break;
        }
        const win = popup.ownerGlobal;
        if (!this.motionActive(win)) {
          break;
        }
        // mica menus live in an OS-drawn acrylic window that CSS cannot
        // animate on Windows — skip the stamp and the forced-layout origin
        // work entirely; they open natively
        if (win.matchMedia("(-moz-windows-mica-popups)").matches) {
          break;
        }
        popup.setAttribute("au-open", "true");
        win.requestAnimationFrame(() => this.setMenuOrigin(popup, win));
        break;
      }
      case "popuphidden": {
        const popup = event.target;
        if (popup?.localName === "menupopup") {
          popup.removeAttribute("au-open");
        }
        break;
      }
    }
  },

  /* Runs in the rAF between popupshowing and the popup's first paint: the
   * forced layout read below resolves the final position, so the origin is
   * set before the pop-in animation's first painted frame. */
  setMenuOrigin(popup, win) {
    try {
      if (popup.state !== "showing" && popup.state !== "open") {
        return;
      }
      const rect = popup.getBoundingClientRect();
      if (!rect.width) {
        return;
      }
      let h = "left";
      let v = "top";
      const anchor = popup.anchorNode;
      if (anchor?.getBoundingClientRect) {
        // anchored menu (menubar, bookmarks, submenu): grow away from the
        // anchor — a menu sitting above/left of it grows up/leftward
        const a = anchor.getBoundingClientRect();
        if (rect.bottom <= a.top + 1) {
          v = "bottom";
        }
        if (rect.right <= a.left + 1) {
          h = "right";
        }
      } else if (this.lastPointer) {
        // coordinate menu (context menu): the corner Gecko pinned to the
        // pointer is the one the menu should grow out of
        const x = this.lastPointer.x - win.mozInnerScreenX;
        const y = this.lastPointer.y - win.mozInnerScreenY;
        h = Math.abs(x - rect.left) <= Math.abs(x - rect.right)
          ? "left"
          : "right";
        v = Math.abs(y - rect.top) <= Math.abs(y - rect.bottom)
          ? "top"
          : "bottom";
      }
      const origin = `${v} ${h}`;
      if (popup.style.getPropertyValue("--au-origin") !== origin) {
        popup.style.setProperty("--au-origin", origin);
      }
    } catch {}
  },
};
