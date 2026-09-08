/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* The optional Setup surface: a CustomizableUI view widget (removable by
 * construction via the toolbar context menu) opening a glass panel with
 * Aurelia's few, essential choices. Everything persists as aurelia.* prefs
 * so the CSS reacts live via -moz-pref() media branches. */

const { CustomizableUI } = ChromeUtils.importESModule(
  "moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs"
);
// user-action-only dependencies stay off the per-window pre-paint path
const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  AddonManager: "resource://gre/modules/AddonManager.sys.mjs",
  SearchService: "moz-src:///toolkit/components/search/SearchService.sys.mjs",
});

/* the generated arkenfox table (~12.5KB) is only needed when the privacy
 * level changes — imported on demand into the shared global, so it parses
 * once per process instead of once per window */
function arkenfox() {
  return ChromeUtils.importESModule(
    "chrome://browser/content/aurelia-components/ArkenfoxPrefs.mjs"
  );
}

const WIDGET_ID = "aurelia-setup-button";
const VIEW_ID = "aurelia-setup-view";

const THEME_IDS = {
  0: "default-theme@mozilla.org",
  1: "firefox-compact-light@mozilla.org",
  2: "firefox-compact-dark@mozilla.org",
};

/* pre-arkenfox hardened prefs — still cleared on Standard so profiles that
 * used the old toggle come back clean */
const LEGACY_HARDENED = [
  "privacy.resistFingerprinting",
  "privacy.resistFingerprinting.letterboxing",
  "dom.security.https_only_mode",
  "network.trr.mode",
];

/* Aurelia policy applied on top of the verbatim arkenfox set: Hardened must
 * never be weaker than Standard. arkenfox re-enables the ETP convenience
 * allow-list; Aurelia's default keeps it off. */
const HARDENED_OVERRIDES = [
  ["privacy.trackingprotection.allow_list.convenience.enabled", false],
];

/* user-branch values captured before Hardened rewrites them, so switching
 * back to Standard can return the profile to its pre-Hardened state */
const SNAPSHOT_PREF = "aurelia.privacy.userPrefSnapshot";

export const AureliaSetup = {
  init(win) {
    this.ensureWidget();
    this.ensureView(win.document);
  },

  ensureWidget() {
    const existing = CustomizableUI.getWidget(WIDGET_ID);
    if (existing && existing.provider === CustomizableUI.PROVIDER_API) {
      return;
    }
    CustomizableUI.createWidget({
      id: WIDGET_ID,
      type: "view",
      viewId: VIEW_ID,
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: "Setup",
      tooltiptext: "Aurelia Setup",
      onViewShowing: event => {
        AureliaSetup.refresh(event.target.ownerDocument);
      },
    });
  },

  ensureView(doc) {
    if (doc.getElementById(VIEW_ID)) {
      return;
    }
    const view = doc.createXULElement("panelview");
    view.id = VIEW_ID;
    view.classList.add("PanelUI-subView", "aurelia-setup-view");

    const body = doc.createXULElement("vbox");
    body.classList.add("panel-subview-body");
    view.appendChild(body);

    body.appendChild(this.header(doc, "Appearance"));
    body.appendChild(
      this.segRow(doc, "au-theme", [
        ["System", 0],
        ["Light", 1],
        ["Dark", 2],
      ], value => this.applyTheme(doc, value))
    );
    body.appendChild(
      this.segRow(doc, "au-glass", [
        ["Glass", 2],
        ["Frosted", 1],
        ["Solid", 0],
      ], value => this.applyGlassLevel(value))
    );
    body.appendChild(
      this.toggleRow(doc, "au-accent", "Gold accent", "aurelia.accent.enabled")
    );
    body.appendChild(
      this.toggleRow(doc, "au-motion", "Animations", "aurelia.motion.enabled")
    );
    body.appendChild(
      this.toggleRow(doc, "au-flair", "Flair animations", "aurelia.motion.flair")
    );
    body.appendChild(
      this.toggleRow(doc, "au-splash", "Startup animation", "aurelia.startup.animation")
    );

    body.appendChild(this.header(doc, "Search"));
    const searchRow = doc.createXULElement("vbox");
    searchRow.id = "aurelia-search-row";
    searchRow.classList.add("au-seg", "au-seg-vertical");
    body.appendChild(searchRow);

    body.appendChild(this.header(doc, "Privacy"));
    body.appendChild(
      this.segRow(doc, "au-privacy", [
        ["Standard", 1],
        ["Hardened", 2],
      ], value => this.applyPrivacy(value))
    );
    const note = doc.createElement("label");
    note.id = "aurelia-privacy-note";
    note.classList.add("au-setup-note");
    // version number is filled in on first panel open (refresh) so the
    // arkenfox table is not loaded at window-open time
    note.textContent =
      "Hardened applies the full arkenfox user.js. Sites may break; some changes need a restart.";
    body.appendChild(note);

    body.appendChild(this.header(doc, "This button"));
    const remove = doc.createXULElement("toolbarbutton");
    remove.classList.add("subviewbutton", "au-remove-button");
    remove.setAttribute("label", "Remove Setup button from toolbar");
    remove.addEventListener("command", () => {
      view.closest("panel")?.hidePopup();
      CustomizableUI.removeWidgetFromArea(WIDGET_ID);
    });
    body.appendChild(remove);
    const hint = doc.createElement("label");
    hint.classList.add("au-setup-note");
    hint.textContent = "Re-add it any time via Menu → More tools → Customize toolbar.";
    body.appendChild(hint);

    const cache = doc.getElementById("appMenu-viewCache");
    (cache?.content ?? cache ?? doc.getElementById("mainPopupSet")).appendChild(view);
  },

  /* First-run onboarding: prepend a welcome header to the Setup view and
   * open it as if the toolbar button were clicked. The header disappears
   * once the panel closes; from then on it is the plain Setup panel. */
  beginOnboarding(win) {
    const doc = win.document;
    this.ensureWidget();
    this.ensureView(doc);
    const view = doc.getElementById(VIEW_ID);
    const body = view?.querySelector(".panel-subview-body");
    const button = doc.getElementById(WIDGET_ID);
    if (!view || !body || !button) {
      return; // button not in a toolbar (customized away) — stay quiet
    }
    if (!body.querySelector(".au-onboard-hello")) {
      const hello = doc.createXULElement("vbox");
      hello.classList.add("au-onboard-hello");
      const title = doc.createElement("label");
      title.classList.add("au-onboard-title");
      title.textContent = "Welcome to Aurelia";
      const note = doc.createElement("label");
      note.classList.add("au-setup-note", "au-onboard-note");
      note.textContent =
        "A minute of setup — appearance, search, privacy. Everything has " +
        "sensible defaults; close this panel to skip. Reopen it any time " +
        "via the Setup button.";
      hello.append(title, note);
      body.prepend(hello);
      view.addEventListener("ViewHiding", () => hello.remove(), {
        once: true,
      });
    }
    button.click();
  },

  header(doc, text) {
    const label = doc.createElement("label");
    label.classList.add("au-setup-header");
    label.textContent = text;
    return label;
  },

  segRow(doc, group, options, apply) {
    const row = doc.createXULElement("hbox");
    row.classList.add("au-seg");
    row.setAttribute("data-au-group", group);
    for (const [label, value] of options) {
      const btn = doc.createXULElement("toolbarbutton");
      btn.classList.add("subviewbutton", "au-seg-button");
      btn.setAttribute("label", label);
      btn.setAttribute("data-au-value", value);
      btn.addEventListener("command", () => {
        apply(value);
        for (const sib of row.children) {
          sib.toggleAttribute("checked", sib === btn);
        }
      });
      row.appendChild(btn);
    }
    return row;
  },

  toggleRow(doc, id, label, prefName) {
    const btn = doc.createXULElement("toolbarbutton");
    btn.id = `aurelia-${id}`;
    btn.classList.add("subviewbutton", "au-toggle");
    btn.setAttribute("label", label);
    btn.setAttribute("data-au-pref", prefName);
    btn.addEventListener("command", () => {
      const next = !Services.prefs.getBoolPref(prefName, true);
      Services.prefs.setBoolPref(prefName, next);
      btn.toggleAttribute("checked", next);
    });
    return btn;
  },

  async applyTheme(doc, mode) {
    try {
      const addon = await lazy.AddonManager.getAddonByID(THEME_IDS[mode]);
      await addon?.enable();
      Services.prefs.setIntPref("aurelia.theme.mode", mode);
    } catch (e) {
      console.error("Aurelia: theme switch failed", e);
    }
  },

  applyGlassLevel(level) {
    Services.prefs.setIntPref("aurelia.glass.level", level);
    // Frosted/Solid paint a ~solid sheet, but DWM would keep re-blurring
    // behind it — turn the OS acrylic backdrop off when it cannot be seen.
    // Live-safe: the mica pref observer restyles all windows immediately.
    if (Services.appinfo.OS === "WINNT") {
      Services.prefs.setBoolPref("widget.windows.mica", level === 2);
      Services.prefs.setIntPref(
        "widget.windows.mica.popups",
        level === 2 ? 2 : 0
      );
    }
  },

  setPrefValue(name, value) {
    if (typeof value === "boolean") {
      Services.prefs.setBoolPref(name, value);
    } else if (typeof value === "number") {
      Services.prefs.setIntPref(name, value);
    } else {
      Services.prefs.setStringPref(name, value);
    }
  },

  snapshotUserValues() {
    const snap = {};
    const names = new Set([
      ...arkenfox().ARKENFOX_PREFS.map(([name]) => name),
      ...LEGACY_HARDENED,
    ]);
    for (const name of names) {
      if (!Services.prefs.prefHasUserValue(name)) {
        continue;
      }
      try {
        switch (Services.prefs.getPrefType(name)) {
          case Services.prefs.PREF_BOOL:
            snap[name] = Services.prefs.getBoolPref(name);
            break;
          case Services.prefs.PREF_INT:
            snap[name] = Services.prefs.getIntPref(name);
            break;
          case Services.prefs.PREF_STRING:
            snap[name] = Services.prefs.getStringPref(name);
            break;
        }
      } catch {}
    }
    Services.prefs.setStringPref(SNAPSHOT_PREF, JSON.stringify(snap));
  },

  restoreUserValues() {
    let snap = {};
    try {
      snap = JSON.parse(Services.prefs.getStringPref(SNAPSHOT_PREF, "{}"));
    } catch {}
    for (const [name, value] of Object.entries(snap)) {
      try {
        this.setPrefValue(name, value);
      } catch (e) {
        console.warn("Aurelia: snapshot restore skipped:", name, e.message);
      }
    }
    Services.prefs.clearUserPref(SNAPSHOT_PREF);
  },

  /* Hardened = the full arkenfox user.js, applied verbatim to the user
   * branch (exactly what dropping the file into a profile does), minus the
   * HARDENED_OVERRIDES policy set. Standard clears every arkenfox pref so
   * Aurelia's own defaults resurface, then restores the user-branch values
   * snapshotted when Hardened was switched on. */
  applyPrivacy(level) {
    const current = Services.prefs.getIntPref("aurelia.privacy.level", 1);
    if (level === current) {
      // re-clicking the active level must not touch the user's prefs
      return;
    }
    const { ARKENFOX_PREFS, ARKENFOX_VERSION } = arkenfox();
    if (level === 2) {
      this.snapshotUserValues();
      for (const [name, value] of ARKENFOX_PREFS) {
        try {
          this.setPrefValue(name, value);
        } catch (e) {
          console.warn("Aurelia: arkenfox pref skipped:", name, e.message);
        }
      }
      for (const [name, value] of HARDENED_OVERRIDES) {
        try {
          this.setPrefValue(name, value);
        } catch (e) {
          console.warn("Aurelia: hardened override failed:", name, e.message);
        }
      }
      console.log(`Aurelia: hardened mode ON (arkenfox ${ARKENFOX_VERSION})`);
    } else {
      for (const [name] of ARKENFOX_PREFS) {
        try {
          Services.prefs.clearUserPref(name);
        } catch {}
      }
      for (const name of LEGACY_HARDENED) {
        try {
          Services.prefs.clearUserPref(name);
        } catch {}
      }
      // clearing may have dropped the ETP category — restore Aurelia strict
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
        console.error("Aurelia: strict restore failed", e);
      }
      // the user's own pre-Hardened choices win over the cleared defaults
      this.restoreUserValues();
    }
    Services.prefs.setIntPref("aurelia.privacy.level", level);
  },

  async refresh(doc) {
    const view = doc.getElementById(VIEW_ID);
    if (!view) {
      return;
    }
    const states = {
      "au-theme": Services.prefs.getIntPref("aurelia.theme.mode", 0),
      "au-glass": Services.prefs.getIntPref("aurelia.glass.level", 2),
      "au-privacy": Services.prefs.getIntPref("aurelia.privacy.level", 1),
    };
    const note = doc.getElementById("aurelia-privacy-note");
    if (note && !note.hasAttribute("data-au-versioned")) {
      note.setAttribute("data-au-versioned", "true");
      note.textContent = `Hardened applies the full arkenfox user.js (v${arkenfox().ARKENFOX_VERSION}). Sites may break; some changes need a restart.`;
    }
    for (const [group, current] of Object.entries(states)) {
      const row = view.querySelector(`[data-au-group="${group}"]`);
      for (const btn of row?.children ?? []) {
        btn.toggleAttribute(
          "checked",
          Number(btn.getAttribute("data-au-value")) === current
        );
      }
    }
    for (const btn of view.querySelectorAll(".au-toggle")) {
      btn.toggleAttribute(
        "checked",
        Services.prefs.getBoolPref(btn.getAttribute("data-au-pref"), true)
      );
    }
    await this.refreshSearch(doc);
  },

  async refreshSearch(doc) {
    const row = doc.getElementById("aurelia-search-row");
    if (!row) {
      return;
    }
    row.replaceChildren();
    try {
      await lazy.SearchService.init();
      const engines = await lazy.SearchService.getVisibleEngines();
      const current = (await lazy.SearchService.getDefault())?.name;
      const reason =
        lazy.SearchService.CHANGE_REASON?.USER ??
        lazy.SearchService.CHANGE_REASON?.UNKNOWN ??
        0;
      for (const engine of engines.slice(0, 8)) {
        const btn = doc.createXULElement("toolbarbutton");
        btn.classList.add("subviewbutton", "au-seg-button");
        btn.setAttribute("label", engine.name);
        btn.toggleAttribute("checked", engine.name === current);
        btn.addEventListener("command", async () => {
          try {
            await lazy.SearchService.setDefault(engine, reason);
            await lazy.SearchService.setDefaultPrivate(engine, reason);
          } catch (e) {
            console.error("Aurelia: setDefault failed", e);
          }
          for (const sib of row.children) {
            sib.toggleAttribute("checked", sib === btn);
          }
        });
        row.appendChild(btn);
      }
    } catch (e) {
      console.error("Aurelia: search engine list failed", e);
    }
  },
};
