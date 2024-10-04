/// <reference path="../declarations.d.ts" />

import theme from "./theme.css?raw"
import keys from "./keys"
import searchEngines from "./search-engines"

export default {
  settings: {
    hintAlign: "left",
    hintCharacters: "qwertasdfgzxcvb",
    omnibarSuggestionTimeout: 500,
    richHintsForKeystroke: 1,
    defaultSearchEngine: "dd",
    stealFocusOnLoad: false,
    blocklistPattern: /mail.google\.com/i,
    useLocalMarkdownAPI: false,
    showModeStatus: true,
    autoSpeakOnInlineQuery: false,
    theme,
  },

  keys,
  searchEngines,

  // Leader for site-specific mappings
  siteleader: "<Space>",

  // Leader for OmniBar searchEngines
  searchleader: "a",

  // Array containing zero or more log levels to enable: log, warn, error
  logLevels: [
    // "log",
    // "warn",
    "error",
  ],
}
