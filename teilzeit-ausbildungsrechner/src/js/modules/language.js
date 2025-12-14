// language.js

const LANGUAGE_STORAGE_KEY = "tzr-language";
const LANGUAGE_EVENT = "app:language-changed";

// Simple memory cache to avoid network requests if we switch back and forth
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
      // NOTE: Using /lang/ to ensure absolute path
      const response = await fetch(`/lang/${lang}.json`);
      if (!response.ok) {
        console.error(`Language file not found: /lang/${lang}.json`);
        // Optional: If en_easy is missing, fallback to en
        if (lang.includes("_easy")) {
          console.warn("Easy language missing, falling back to base language.");
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

    // 3. Update DOM
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

    // 4. Update HTML Lang Attribute (remove _easy for browser)
    const htmlLang = currentLanguage.split("_")[0];
    document.documentElement.setAttribute("lang", htmlLang);

    // 5. Update Easy Language Checkbox State
    const easyCheckbox = document.getElementById("easy-language-checkbox");
    if (easyCheckbox) {
      // Checkbox is ON if the current language string contains "_easy"
      easyCheckbox.checked = currentLanguage.includes("_easy");
    }

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
 * Initializes the dropdowns and click listeners
 */
export function initializeLanguageSwitcher() {
  const langToggle = document.getElementById("language-toggle");
  const langMenu = document.getElementById("language-menu");
  const languageOptions = document.querySelectorAll(".language-option");

  const easyToggle = document.getElementById("easy-language-toggle");
  const easyMenu = document.getElementById("easy-language-menu");
  const easyCheckbox = document.getElementById("easy-language-checkbox");

  // Load stored language on startup
  const storedLang = sessionStorage.getItem(LANGUAGE_STORAGE_KEY);
  applyTranslations(storedLang || "de");

  // --- Standard Language Menu ---
  if (langToggle && langMenu) {
    langToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (easyMenu) easyMenu.classList.remove("show");
      langMenu.classList.toggle("show");
    });

    languageOptions.forEach((option) => {
      option.addEventListener("click", function (e) {
        e.preventDefault();

        // 1. Get the new base language (e.g., "en" or "de")
        // NOTE: Relying on data-lang attribute is safer than span content
        let newBaseLang = this.getAttribute("data-lang");

        // Fallback to text content if data attribute is missing
        if (!newBaseLang) {
          const langSpan = this.querySelector("span");
          if (langSpan) newBaseLang = langSpan.textContent.toLowerCase().trim();
        }

        if (newBaseLang) {
          // 2. Check if Easy Mode is currently ON
          const isEasyMode = easyCheckbox ? easyCheckbox.checked : false;

          // 3. Combine them (e.g. "en" + "_easy" -> "en_easy")
          const finalLang = isEasyMode ? `${newBaseLang}_easy` : newBaseLang;

          applyTranslations(finalLang);
        }
        langMenu.classList.remove("show");
      });
    });
  }

  // --- Easy Language Menu ---
  if (easyToggle && easyMenu && easyCheckbox) {
    easyToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (langMenu) langMenu.classList.remove("show");
      easyMenu.classList.toggle("show");
    });

    easyMenu.addEventListener("click", (e) => e.stopPropagation());

    easyCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;

      // 1. Get current base language (strip _easy if it exists)
      // e.g. "en_easy" -> "en", "de" -> "de"
      const currentBase = currentLanguage.split("_")[0];

      // 2. Append _easy only if checked
      const nextLanguage = isChecked ? `${currentBase}_easy` : currentBase;

      applyTranslations(nextLanguage);
    });
  }

  // --- Global Click to Close ---
  window.addEventListener("click", (e) => {
    if (
      langMenu &&
      !langToggle.contains(e.target) &&
      !langMenu.contains(e.target)
    ) {
      langMenu.classList.remove("show");
    }
    if (
      easyMenu &&
      !easyToggle.contains(e.target) &&
      !easyMenu.contains(e.target)
    ) {
      easyMenu.classList.remove("show");
    }
  });
}
