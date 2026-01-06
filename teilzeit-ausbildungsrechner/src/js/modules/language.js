// language.js

const LANGUAGE_STORAGE_KEY = "tzr-language";
const LANGUAGE_EVENT = "app:language-changed";

// Simple memory cache
const loadedLanguages = {};

let currentLanguage = "de";
let currentTranslations = {};

/**
 * Synchronous helper to get a specific string from memory.
 */
export function getTranslation(key, lang = currentLanguage) {
  const sourceData = loadedLanguages[lang] || currentTranslations;
  return sourceData[key] ?? "";
}

export function onLanguageChange(callback) {
  document.addEventListener(LANGUAGE_EVENT, (event) => {
    if (event.detail?.language) {
      callback(event.detail.language);
    }
  });
}

/**
 * Main Logic: Fetches JSON and updates the DOM
 */
export async function applyTranslations(lang = currentLanguage) {
  try {
    // 1. Fetch Data
    let translations = loadedLanguages[lang];

    if (!translations) {
      const response = await fetch(`/lang/${lang}.json`);
      if (!response.ok) {
        console.error(`Language file not found: /lang/${lang}.json`);
        // Fallback safety
        if (lang.includes("_easy")) {
          console.warn("Easy language file missing, falling back to base.");
          return applyTranslations(lang.split("_")[0]);
        }
        return;
      }
      translations = await response.json();
      loadedLanguages[lang] = translations; // Save to cache
    }

    // 2. Update State
    currentLanguage = lang;
    currentTranslations = translations;
    sessionStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);

    // 3. Update DOM Text
    document.querySelectorAll("[data-translate-key]").forEach((el) => {
      const key = el.dataset.translateKey;
      const translation = translations[key];

      if (!translation) return;

      const attrTarget = el.dataset.translateAttr;
      const mode = el.dataset.translateMode;

      if (attrTarget) {
        el.setAttribute(attrTarget, translation);
      } else if (mode === "html") {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    });

    // 4. Update HTML Lang Attribute
    const htmlLang = currentLanguage.split("_")[0];
    document.documentElement.setAttribute("lang", htmlLang);

    // 5. Update UI Button States (Visual Feedback)
    updateButtonStates(currentLanguage);

    // 6. Notify other parts of the app
    const event = new CustomEvent(LANGUAGE_EVENT, {
      detail: { language: lang },
    });
    document.dispatchEvent(event);
  } catch (error) {
    console.error("Error applying translations:", error);
  }
}

/**
 * Helper to visually toggle the buttons
 */
function updateButtonStates(lang) {
  // 1. Update "Leichte Sprache" Button Appearance
  const easyBtn = document.getElementById("easy-language-toggle");
  if (easyBtn) {
    if (lang === "de_easy") {
      easyBtn.classList.add("active"); // Wird rot (basierend auf CSS)
    } else {
      easyBtn.classList.remove("active"); // Wird weiß (basierend auf CSS)
    }
  }

  // 2. Optional: Reset standard language active state if needed
  // (Standard logic usually highlights the current flag, handled below)
}

/**
 * Initializes the listeners
 */
export function initializeLanguageSwitcher() {
  const langToggle = document.getElementById("language-toggle");
  const langMenu = document.getElementById("language-menu");
  const languageOptions = document.querySelectorAll(".language-option");

  const easyToggle = document.getElementById("easy-language-toggle");

  // Load stored language on startup
  const storedLang = sessionStorage.getItem(LANGUAGE_STORAGE_KEY);
  applyTranslations(storedLang || "de");

  // --- Standard Language Menu (Dropdown für Flaggen) ---
  if (langToggle && langMenu) {
    langToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      langMenu.classList.toggle("show");
    });

    languageOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.preventDefault();

        // 1. Get the new base language (e.g., "en" or "de")
        let newBaseLang = this.getAttribute("data-lang");

        // Fallback if data-lang is missing (getting text content)
        if (!newBaseLang) {
          const span = this.querySelector("span");
          if (span && span.dataset.translateKey) {
            // Mapping keys like nav_language_en to 'en'
            const key = span.dataset.translateKey;
            newBaseLang = key.split("_").pop(); // e.g. "en" from "nav_language_en"
          }
        }

        // Hardcoded fix if mapping fails, assuming standard structure
        if (!newBaseLang) {
          // Try to guess from text or ensure your HTML has data-lang attributes
          console.warn(
            "Please add data-lang='en' etc to your dropdown links for safety",
          );
        }

        // Just reload logic based on context (assuming standard click behavior)
        // If data-lang is missing in HTML, ensure it is added or rely on text logic from before.
        // For now, let's keep the previous robust logic:
        if (!newBaseLang) {
          const langSpan = this.querySelector("span");
          if (langSpan) {
            const text = langSpan.textContent.toLowerCase().trim();
            // Map text like "en", "de" directly if they match filenames
            newBaseLang = text;
          }
        }

        if (newBaseLang) {
          applyTranslations(newBaseLang);
        }
        langMenu.classList.remove("show");
      });
    });
  }

  // --- Easy Language Toggle (Direkter Klick, kein Dropdown) ---
  if (easyToggle) {
    easyToggle.addEventListener("click", (e) => {
      e.preventDefault();
      // Dropdown-Events stoppen, falls Menü offen war
      e.stopPropagation();
      if (langMenu) langMenu.classList.remove("show");

      // LOGIC: Toggle Switch
      // Wenn wir schon in de_easy sind -> zurück zu de
      // Wenn wir woanders sind -> zu de_easy
      if (currentLanguage === "de_easy") {
        applyTranslations("de");
      } else {
        applyTranslations("de_easy");
      }
    });
  }

  // --- Global Click to Close (Only for standard lang menu) ---
  window.addEventListener("click", (e) => {
    if (
      langMenu &&
      !langToggle.contains(e.target) &&
      !langMenu.contains(e.target)
    ) {
      langMenu.classList.remove("show");
    }
  });
}

// --- Test/Bootstrap helper ---
export function __setTranslationsForTests(lang, translations) {
  loadedLanguages[lang] = translations || {};
  currentLanguage = lang;
  currentTranslations = loadedLanguages[lang];
}
