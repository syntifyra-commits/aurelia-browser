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
const { AddonManager } = ChromeUtils.importESModule(
  "resource://gre/modules/AddonManager.sys.mjs"
);
const { SearchService } = ChromeUtils.importESModule(
  "moz-src:///toolkit/components/search/SearchService.sys.mjs"
);
import {
  ARKENFOX_PREFS,
  ARKENFOX_VERSION,
} from "chrome://browser/content/aurelia-components/ArkenfoxPrefs.mjs";

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
      ], value => Services.prefs.setIntPref("aurelia.glass.level", value))
    );
    body.appendChild(
      this.toggleRow(doc, "au-accent", "Gold accent", "aurelia.accent.enabled")
    );
    body.appendChild(
      this.toggleRow(doc, "au-motion", "Animations", "aurelia.motion.enabled")
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
    note.classList.add("au-setup-note");
    note.textContent = `Hardened applies the full arkenfox user.js (v${ARKENFOX_VERSION}). Sites may break; some changes need a restart.`;
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
      const addon = await AddonManager.getAddonByID(THEME_IDS[mode]);
      await addon?.enable();
      Services.prefs.setIntPref("aurelia.theme.mode", mode);
    } catch (e) {
      console.error("Aurelia: theme switch failed", e);
    }
  },

  /* Hardened = the full arkenfox user.js, applied verbatim to the user
   * branch (exactly what dropping the file into a profile does). Standard
   * clears every arkenfox pref so Aurelia's own defaults resurface. */
  applyPrivacy(level) {
    if (level === 2) {
      for (const [name, value] of ARKENFOX_PREFS) {
        try {
          if (typeof value === "boolean") {
            Services.prefs.setBoolPref(name, value);
          } else if (typeof value === "number") {
            Services.prefs.setIntPref(name, value);
          } else {
            Services.prefs.setStringPref(name, value);
          }
        } catch (e) {
          console.warn("Aurelia: arkenfox pref skipped:", name, e.message);
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
      await SearchService.init();
      const engines = await SearchService.getVisibleEngines();
      const current = (await SearchService.getDefault())?.name;
      const reason =
        SearchService.CHANGE_REASON?.USER ??
        SearchService.CHANGE_REASON?.UNKNOWN ??
        0;
      for (const engine of engines.slice(0, 8)) {
        const btn = doc.createXULElement("toolbarbutton");
        btn.classList.add("subviewbutton", "au-seg-button");
        btn.setAttribute("label", engine.name);
        btn.toggleAttribute("checked", engine.name === current);
        btn.addEventListener("command", async () => {
          try {
            await SearchService.setDefault(engine, reason);
            await SearchService.setDefaultPrivate(engine, reason);
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
