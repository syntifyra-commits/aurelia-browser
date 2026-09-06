// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Aurelia default preferences. Loaded after firefox.js, so values here win.
// Philosophy: private by default with zero breakage; hardline options live
// behind the single "Hardened" toggle in the Setup panel.

// ═══ First run: instantly usable ═══════════════════════════════════════════
pref("browser.aboutwelcome.enabled", false);
pref("browser.preonboarding.enabled", false);
pref("startup.homepage_welcome_url", "");
pref("startup.homepage_welcome_url.additional", "");
pref("startup.homepage_override_url", "");
pref("browser.startup.homepage_override.mstone", "ignore");
pref("browser.startup.upgradeDialog.enabled", false);
pref("browser.shell.checkDefaultBrowser", false);
pref("browser.shell.skipDefaultBrowserCheckOnFirstRun", true);
pref("browser.laterrun.enabled", false, locked);
pref("browser.disableResetPrompt", true);
pref("browser.aboutConfig.showWarning", false);
pref("browser.startup.windowsLaunchOnLogin.defaultEnabled", false);
pref("browser.startup.windowsLaunchOnLogin.disableLaunchOnLoginPrompt", true);
pref("termsofuse.bypassNotification", true, locked);
pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true, locked);
pref("datareporting.policy.dataSubmissionPolicyAcceptedVersion", 999, locked);
pref("browser.startup.homepage", "about:blank");
pref("browser.startup.page", 1);
pref("browser.newtabpage.enabled", false);
pref("browser.toolbars.bookmarks.visibility", "never");
pref("browser.messaging-system.whatsNewPanel.enabled", false);
pref("messaging-system.rsexperimentloader.enabled", false);
pref("toolkit.winRegisterApplicationRestart", false);

// pin the stable Proton UI branch (Nova redesign is mid-flight upstream)
pref("browser.nova.enabled", false);

// ═══ Telemetry & phone-home (belt; configure patch is the braces) ══════════
pref("toolkit.telemetry.unified", false, locked);
pref("toolkit.telemetry.enabled", false, locked);
pref("toolkit.telemetry.server", "data:,", locked);
pref("toolkit.telemetry.archive.enabled", false, locked);
pref("toolkit.telemetry.newProfilePing.enabled", false, locked);
pref("toolkit.telemetry.updatePing.enabled", false, locked);
pref("toolkit.telemetry.firstShutdownPing.enabled", false, locked);
pref("toolkit.telemetry.shutdownPingSender.enabled", false, locked);
pref("toolkit.telemetry.bhrPing.enabled", false, locked);
pref("toolkit.telemetry.coverage.opt-out", true, locked);
pref("toolkit.coverage.opt-out", true, locked);
pref("toolkit.coverage.enabled", false, locked);
pref("toolkit.coverage.endpoint.base", "", locked);
pref("datareporting.healthreport.uploadEnabled", false, locked);
pref("datareporting.policy.dataSubmissionEnabled", false, locked);
pref("datareporting.usage.uploadEnabled", false, locked);
pref("dom.private-attribution.submission.enabled", false, locked);
pref("browser.ping-centre.telemetry", false);
pref("browser.attribution.enabled", false);
pref("browser.newtabpage.activity-stream.telemetry", false, locked);
pref("browser.newtabpage.activity-stream.feeds.telemetry", false, locked);
pref("browser.search.serpEventTelemetryCategorization.enabled", false);
pref("security.xfocsp.errorReporting.enabled", false);
pref("captchadetection.actor.enabled", false);
pref("toolkit.contentRelevancy.enabled", false);
pref("toolkit.contentRelevancy.ingestEnabled", false);

// studies / normandy / nimbus
pref("app.normandy.enabled", false, locked);
pref("app.normandy.api_url", "", locked);
pref("app.shield.optoutstudies.enabled", false, locked);
pref("nimbus.rollouts.enabled", false, locked);
pref("browser.discovery.enabled", false, locked);
pref("startup.homepage_override_nimbus_disable_wnp", true, locked);

// crash reporting (also disabled at build time)
pref("breakpad.reportURL", "", locked);
pref("browser.tabs.crashReporting.sendReport", false, locked);
pref("browser.crashReports.unsubmittedCheck.enabled", false);
pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);

// connectivity: keep captive-portal UX, drop the separate connectivity ping
pref("network.connectivity-service.enabled", false);

// pocket successor / ads / promos / recommendations
pref("browser.newtabpage.activity-stream.unifiedAds.tiles.enabled", false, locked);
pref("browser.newtabpage.activity-stream.unifiedAds.spocs.enabled", false, locked);
pref("browser.newtabpage.activity-stream.unifiedAds.adsFeed.enabled", false, locked);
pref("browser.newtabpage.activity-stream.showSponsored", false);
pref("browser.newtabpage.activity-stream.showSponsoredTopSites", false);
pref("browser.newtabpage.activity-stream.discoverystream.enabled", false);
pref("browser.newtabpage.activity-stream.feeds.section.topstories", false);
pref("browser.newtabpage.activity-stream.feeds.system.topstories", false);
pref("browser.newtabpage.activity-stream.default.sites", "", locked);
pref("browser.topsites.contile.enabled", false);
pref("browser.topsites.useRemoteSetting", false);
pref("identity.fxaccounts.toolbar.pxiToolbarEnabled", false, locked);
pref("browser.vpn_promo.enabled", false, locked);
pref("browser.promo.focus.enabled", false, locked);
pref("browser.preferences.moreFromMozilla", false, locked);
pref("browser.privatebrowsing.vpnpromourl", "", locked);
pref("signon.firefoxRelay.feature", "disabled");
pref("browser.newtabpage.activity-stream.asrouter.providers.cfr", "null", locked);
pref("browser.newtabpage.activity-stream.asrouter.providers.message-groups", "null", locked);
pref("browser.newtabpage.activity-stream.asrouter.providers.messaging-experiments", "null", locked);
pref("browser.newtabpage.activity-stream.asrouter.providers.onboarding", "null", locked);
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.addons", false);
pref("browser.newtabpage.activity-stream.asrouter.userprefs.cfr.features", false);
pref("extensions.getAddons.showPane", false);
pref("extensions.htmlaboutaddons.recommendations.enabled", false);
pref("extensions.getAddons.cache.enabled", false);

// AI / ML stack off by default (translations stay available via policy)
pref("browser.ai.control.default", "blocked", locked);
pref("browser.ml.enable", false, locked);
pref("browser.ml.chat.enabled", false, locked);
pref("browser.ml.chat.menu", false);
pref("browser.ml.linkPreview.enabled", false, locked);
pref("browser.tabs.groups.smart.enabled", false, locked);
pref("extensions.ml.enabled", false, locked);
pref("browser.urlbar.quicksuggest.mlEnabled", false, locked);
pref("pdfjs.enableAltText", false, locked);
pref("pdfjs.enableAltTextModelDownload", false, locked);

// Firefox account / Sync: stripped entirely — Aurelia has no cloud identity
pref("identity.fxaccounts.enabled", false, locked);
pref("browser.preferences.experimental", false);
pref("browser.tabs.firefox-view", false);

// misc phone-home & leaks
pref("browser.uitour.enabled", false, locked);
pref("browser.uitour.url", "", locked);
pref("browser.region.network.url", "");
pref("browser.region.network.scan", false);
pref("browser.region.update.enabled", false);
pref("browser.send_pings", false);
pref("network.dns.disablePrefetch", true);
pref("network.dns.disablePrefetchFromHTTPS", true);
pref("network.prefetch-next", false);
pref("network.predictor.enabled", false);
pref("browser.places.speculativeConnect.enabled", false);
pref("browser.urlbar.speculativeConnect.enabled", false);
pref("extensions.webcompat-reporter.enabled", false, locked);
pref("extensions.abuseReport.enabled", false);
pref("geo.provider.network.url", "https://api.beacondb.net/v1/geolocate");
pref("default-browser-agent.enabled", false, locked);

// ═══ Tracking protection: strict, untouched ════════════════════════════════
// Do NOT set any pref the strict bundle drives, or Firefox flips the
// category to "custom" at runtime.
pref("browser.contentblocking.category", "strict");
pref("privacy.trackingprotection.allow_list.baseline.enabled", true);
pref("privacy.trackingprotection.allow_list.convenience.enabled", false);
pref("network.cookie.cookieBehavior.optInPartitioning", true);
pref("network.cookie.cookieBehavior.optInPartitioning.pbmode", true);
pref("privacy.query_stripping.strip_on_share.enabled", true);
pref("privacy.query_stripping.allow_list", "urldefense.com");
pref("privacy.query_stripping.strip_list", "__hsfp __hssc __hstc __s _bhlid _branch_match_id _branch_referrer _gl _hsenc _openstat at_recipient_id at_recipient_list bbeml bsft_clkid bsft_uid dclid et_rid fb_action_ids fb_comment_id gbraid fbclid gclid guce_referrer guce_referrer_sig hsCtaTracking irclickid mc_eid ml_subscriber ml_subscriber_hash msclkid mtm_cid oft_c oft_ck oft_d oft_id oft_ids oft_k oft_lk oft_sk oly_anon_id oly_enc_id pk_cid rb_clickid s_cid sc_customer sc_eh sc_uid sfmc_activityid sfmc_id sms_click sms_source sms_uph srsltid ss_email_id syclid ttclid twclid unicorn_click_id vero_conv vero_id vgo_ee wbraid wickedid yclid ymclid ysclid");
pref("cookiebanners.service.mode", 1);
pref("cookiebanners.service.mode.privateBrowsing", 1);

// fingerprinting: FPP (crowd-free, per-site randomization), NOT RFP
pref("privacy.fingerprintingProtection", true);
pref("privacy.fingerprintingProtection.pbmode", true);
pref("privacy.fingerprintingProtection.remoteOverrides.enabled", true);
pref("privacy.resistFingerprinting", false);
pref("privacy.resistFingerprinting.letterboxing", false);
pref("privacy.resistFingerprinting.block_mozAddonManager", true);
pref("privacy.globalprivacycontrol.enabled", true);
pref("privacy.globalprivacycontrol.pbmode.enabled", true);
pref("privacy.globalprivacycontrol.functionality.enabled", true);
pref("privacy.donottrackheader.enabled", false);

// transport: HTTPS-First everywhere, full HTTPS-Only in private windows
pref("dom.security.https_only_mode", false);
pref("dom.security.https_only_mode_pbm", true);
pref("dom.security.https_first", true);
pref("dom.security.https_first_pbm", true);
pref("network.http.referer.XOriginTrimmingPolicy", 2);

// DNS: encrypted with graceful fallback (captive portals keep working)
pref("network.trr.mode", 2);
pref("network.trr.uri", "https://dns.quad9.net/dns-query");
pref("network.trr.default_provider_uri", "https://dns.quad9.net/dns-query");
pref("network.trr.exclude-etc-hosts", false);
pref("doh-rollout.enabled", false);

// WebRTC leak protection
pref("media.peerconnection.ice.default_address_only", true);
pref("media.peerconnection.ice.proxy_only_if_behind_proxy", true);
pref("media.peerconnection.ice.obfuscate_host_addresses", true);
pref("network.proxy.socks_remote_dns", true);

// containers on; session privacy details
pref("privacy.userContext.enabled", true);
pref("privacy.userContext.ui.enabled", true);
pref("browser.sessionstore.privacy_level", 2);
pref("browser.download.start_downloads_in_tmp_dir", true);
pref("browser.helperApps.deleteTempFileOnExit", true);
pref("browser.download.manager.addToRecentDocs", false);
pref("browser.shell.shortcutFavicons", false);

// security hardening (safe subset)
pref("security.cert_pinning.enforcement_level", 2);
pref("security.pki.crlite_mode", 2);
pref("security.remote_settings.crlite_filters.enabled", true);
pref("security.OCSP.require", false);
pref("security.tls.version.enable-deprecated", false);
pref("security.ssl.require_safe_negotiation", true);
pref("security.enterprise_roots.enabled", false);
pref("security.certerrors.mitm.auto_enable_enterprise_roots", false);
pref("pdfjs.enableScripting", false);
pref("media.autoplay.default", 5);

// DRM: available, but only with explicit consent
pref("media.eme.require-app-approval", true);

// SafeBrowsing: local lists ON (offline matching), the one real per-URL
// leak (remote download reputation) OFF
pref("browser.safebrowsing.malware.enabled", true);
pref("browser.safebrowsing.phishing.enabled", true);
pref("browser.safebrowsing.blockedURIs.enabled", true);
pref("browser.safebrowsing.downloads.enabled", true);
pref("browser.safebrowsing.downloads.remote.enabled", false);
pref("browser.safebrowsing.downloads.remote.url", "");
pref("browser.safebrowsing.downloads.remote.block_potentially_unwanted", false);
pref("browser.safebrowsing.downloads.remote.block_uncommon", false);
pref("browser.safebrowsing.provider.google4.dataSharingURL", "");
pref("browser.safebrowsing.provider.google4.dataSharing.enabled", false);

// search: no keystroke streaming; local history/bookmark suggestions stay
pref("browser.search.suggest.enabled", false);
pref("browser.search.suggest.enabled.private", false);
pref("browser.urlbar.suggest.searches", false);
pref("browser.urlbar.suggest.trending", false);
pref("browser.urlbar.trending.featureGate", false);
pref("browser.urlbar.suggest.quicksuggest.sponsored", false);
pref("browser.urlbar.suggest.quicksuggest.nonsponsored", false);
pref("browser.urlbar.quicksuggest.enabled", false);
pref("browser.urlbar.suggest.weather", false);
pref("browser.urlbar.weather.featureGate", false);
pref("browser.urlbar.addons.featureGate", false);
pref("browser.urlbar.mdn.featureGate", false);
pref("browser.urlbar.yelp.featureGate", false);
pref("browser.urlbar.dnsResolveSingleWordsAfterSearch", 0);
pref("browser.search.update", false);
pref("browser.search.separatePrivateDefault", true);
pref("keyword.enabled", true);

// updates: local build has no update channel
pref("app.update.auto", false);
pref("app.update.service.enabled", false);
pref("app.update.background.scheduling.enabled", false);
pref("media.gmp-manager.updateEnabled", false);
pref("extensions.systemAddon.update.enabled", false);
pref("extensions.systemAddon.update.url", "");

// ═══ Aurelia glass stack ═══════════════════════════════════════════════════
#ifdef XP_WIN
pref("widget.windows.mica", true);
pref("widget.windows.mica.toplevel-backdrop", 2);
pref("widget.windows.mica.popups", 2);
#endif
// content area stays opaque: full-window transparency costs compositor
// performance and causes paint ghosting; the chrome keeps the acrylic

// ═══ Aurelia UI state (CSS reacts live via -moz-pref branches) ═════════════
pref("aurelia.theme.mode", 0);       // 0 system · 1 light · 2 dark
pref("aurelia.accent.enabled", true);
pref("aurelia.glass.level", 2);      // 2 glass · 1 frosted · 0 solid
pref("aurelia.motion.enabled", true);
pref("aurelia.startup.animation", true);
pref("aurelia.privacy.level", 1);    // 1 standard · 2 hardened
