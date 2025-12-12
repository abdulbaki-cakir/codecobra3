import translations from "../translations.json";

const LANGUAGE_STORAGE_KEY = "tzr-language";
const LANGUAGE_EVENT = "app:language-changed";
let currentLanguage = "de";

function getTranslationsFor(lang) {
  return translations[lang] || translations.de || {};
}

function dispatchLanguageChanged(lang) {
  const event = new CustomEvent(LANGUAGE_EVENT, { detail: { language: lang } });
  document.dispatchEvent(event);
}

export function getTranslation(key, lang = currentLanguage) {
  const languageData = getTranslationsFor(lang);
  return languageData[key] ?? translations.de?.[key] ?? "";
}

export function onLanguageChange(callback) {
  document.addEventListener(LANGUAGE_EVENT, (event) => {
    if (event.detail?.language) {
      callback(event.detail.language);
    }
  });
}

export function applyTranslations(lang = currentLanguage) {
  currentLanguage = translations[lang] ? lang : "de";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);

  const languageData = getTranslationsFor(currentLanguage);

  const elements = document.querySelectorAll("[data-translate-key]");
  elements.forEach((el) => {
    const key = el.dataset.translateKey;
    if (!key) return;

    const translation =
      languageData[key] ?? translations.de?.[key] ?? el.textContent;
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

  const htmlLang = currentLanguage.startsWith("de")
    ? "de"
    : currentLanguage.split("_")[0] || "de";
  document.documentElement.setAttribute("lang", htmlLang);

  dispatchLanguageChanged(currentLanguage);
}

/**
 * Aktiviert das Sprach-Dropdown und schaltet die Variante "Leichte Sprache" um.
 */
function initializeLanguageSwitcher() {
  const toggleButton = document.getElementById("language-toggle");
  const menu = document.getElementById("language-menu");
  const languageOptions = document.querySelectorAll(".language-option");
  const easyToggle = document.getElementById("easy-language-toggle");

  // Initiale Sprache aus dem Speicher lesen
  const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  applyTranslations(storedLang || "de");

  if (toggleButton && menu) {
    toggleButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      menu.classList.toggle("show");
    });

    languageOptions.forEach((option) => {
      option.addEventListener("click", function (event) {
        event.preventDefault();
        menu.classList.remove("show");
      });
    });

    window.addEventListener("click", function (event) {
      if (!toggleButton.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.remove("show");
      }
    });
  }

  if (easyToggle) {
    easyToggle.addEventListener("click", (event) => {
      event.preventDefault();
      const nextLanguage = currentLanguage === "de_easy" ? "de" : "de_easy";
      applyTranslations(nextLanguage);
      easyToggle.classList.toggle("active", nextLanguage === "de_easy");
    });

    easyToggle.classList.toggle("active", currentLanguage === "de_easy");
  }
}

export { initializeLanguageSwitcher };
