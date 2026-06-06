/*
 * NeuronProcess lightweight i18n (EN/ES).
 *
 * - Swaps every [data-i18n="key"] element to the active language using the
 *   dictionary in translations.js (window.translations).
 * - Language selection priority:
 *     1) explicit manual choice (remembered forever)
 *     2) fast synchronous guess from browser language (no flash)
 *     3) geo-IP country refinement: English-speaking country -> EN, else -> ES
 * - Exposes window.setLanguage('en'|'es') for the header toggle.
 */
(function () {
  "use strict";

  var DEFAULT_LANG = "es";
  var SUPPORTED = ["en", "es"];

  // Countries where English is the primary web language -> show English.
  // Everyone else falls through to Spanish (per business rule).
  var EN_COUNTRIES = {
    US: 1, GB: 1, CA: 1, AU: 1, NZ: 1, IE: 1, ZA: 1, IN: 1, SG: 1, PH: 1,
    NG: 1, GH: 1, KE: 1, JM: 1, TT: 1, BZ: 1, BS: 1, BB: 1, MT: 1, GY: 1,
    FJ: 1, PG: 1, ZW: 1, UG: 1, ZM: 1
  };

  function ls(get, key, val) {
    try {
      if (get) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { /* storage unavailable (private mode) */ }
    return null;
  }

  function injectStyles() {
    if (document.getElementById("np-i18n-style")) return;
    var css =
      ".lang-switch{display:inline-flex;border:1px solid rgba(255,255,255,.35);" +
      "border-radius:20px;overflow:hidden;margin-left:1rem;vertical-align:middle}" +
      ".lang-switch button{background:transparent;border:0;color:#37517e;" +
      "font:600 0.8rem/1 'Open Sans',sans-serif;padding:.35rem .7rem;cursor:pointer}" +
      ".lang-switch button.active{background:#47b2e4;color:#fff}" +
      ".header .lang-switch{border-color:rgba(55,81,126,.3)}" +
      "@media (max-width:1199px){.lang-switch{margin-left:.5rem}}";
    var s = document.createElement("style");
    s.id = "np-i18n-style";
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;
    var dict = (window.translations &&
      (window.translations[lang] || window.translations[DEFAULT_LANG])) || {};

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var t = dict[el.getAttribute("data-i18n")];
      if (t == null) continue;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = t;
      } else if (t.indexOf("<") !== -1) {
        el.innerHTML = t;
      } else {
        el.textContent = t;
      }
    }

    // Translatable attributes, e.g. <meta data-i18n-content="meta_desc">
    var metas = document.querySelectorAll("[data-i18n-content]");
    for (var j = 0; j < metas.length; j++) {
      var m = metas[j];
      var mt = dict[m.getAttribute("data-i18n-content")];
      if (mt != null) m.setAttribute("content", mt);
    }

    document.documentElement.lang = lang;
    syncSwitcher(lang);
  }

  function syncSwitcher(lang) {
    var btns = document.querySelectorAll("[data-lang-btn]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("active", btns[i].getAttribute("data-lang-btn") === lang);
    }
  }

  function guessFromBrowser() {
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || ""];
    for (var i = 0; i < langs.length; i++) {
      var l = (langs[i] || "").toLowerCase();
      if (l.indexOf("en") === 0) return "en";
      if (l.indexOf("es") === 0) return "es";
    }
    return null;
  }

  function detectByCountry() {
    if (!window.fetch) return Promise.resolve(null);
    return fetch("https://api.country.is/", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        var c = d && d.country ? String(d.country).toUpperCase() : "";
        return EN_COUNTRIES[c] ? "en" : "es";
      })
      .catch(function () { return null; });
  }

  function setLanguage(lang, manual) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    applyLang(lang);
    ls(false, "user_lang", lang);
    if (manual) ls(false, "user_lang_manual", "1");
  }

  function init() {
    injectStyles();

    var stored = ls(true, "user_lang");
    var manual = ls(true, "user_lang_manual");

    // 1) Respect an explicit manual choice forever.
    if (manual && SUPPORTED.indexOf(stored) !== -1) {
      applyLang(stored);
      return;
    }

    // 2) Fast synchronous guess so there is no flash of the wrong language.
    var fast = (SUPPORTED.indexOf(stored) !== -1) ? stored
      : (guessFromBrowser() || DEFAULT_LANG);
    applyLang(fast);

    // 3) Refine by country once, then cache.
    if (!ls(true, "user_lang_geo")) {
      detectByCountry().then(function (lang) {
        ls(false, "user_lang_geo", "1");
        if (!lang || ls(true, "user_lang_manual")) return; // user chose meanwhile
        if (lang !== document.documentElement.lang) applyLang(lang);
        ls(false, "user_lang", lang);
      });
    }
  }

  window.setLanguage = function (lang) { setLanguage(lang, true); };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
