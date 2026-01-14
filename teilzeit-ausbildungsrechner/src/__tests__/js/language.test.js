/** @jest-environment jsdom */
import { jest } from "@jest/globals";
import * as Language from "../../js/modules/language.js";

// Mock global objects
global.fetch = jest.fn();
const mockDispatch = jest.fn();
document.dispatchEvent = mockDispatch;

describe("language.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();

    // Reset internal state using the helper
    // We intentionally initialize 'de' in cache to match app startup behavior
    if (Language.__setTranslationsForTests) {
      Language.__setTranslationsForTests("de", {});
    }

    // Setup basic DOM structure for tests
    document.body.innerHTML = `
      <html lang="de">
        <div id="language-toggle">Toggle</div>
        <div id="language-menu">
          <a href="#" class="language-option" data-lang="en"><span>English</span></a>
        </div>
        <button id="easy-language-toggle">Leichte Sprache</button>
        
        <span data-translate-key="GREETING">Original</span>
        <span data-translate-key="HTML_CONTENT" data-translate-mode="html"></span>
        <input data-translate-key="PLACEHOLDER_TXT" data-translate-attr="placeholder" />
      </html>
    `;
  });

  describe("getTranslation", () => {
    test("retrieves existing key", () => {
      Language.__setTranslationsForTests("de", { HELLO: "Hallo" });
      expect(Language.getTranslation("HELLO")).toBe("Hallo");
    });

    test("returns empty string for missing key", () => {
      Language.__setTranslationsForTests("de", {});
      expect(Language.getTranslation("MISSING")).toBe("");
    });
  });

  describe("applyTranslations", () => {
    test("fetches language file if not cached", async () => {
      const mockData = { GREETING: "Hello World" };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await Language.applyTranslations("en");

      expect(global.fetch).toHaveBeenCalledWith("/lang/en.json");
      const el = document.querySelector('[data-translate-key="GREETING"]');
      expect(el.textContent).toBe("Hello World");
    });

    test("handles 404 error gracefully", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      global.fetch.mockResolvedValueOnce({ ok: false });

      // Use a language NOT in cache (e.g., Italian)
      await Language.applyTranslations("it");

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("not found"),
      );
      consoleSpy.mockRestore();
    });

    test("handles fallback from _easy to base language if file missing", async () => {
      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      // Mock Sequence:
      // 1. Fetch 'fr_easy' -> Fails (404)
      // 2. Fetch 'fr' -> Succeeds (200)
      global.fetch.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ GREETING: "Bonjour" }),
      });

      // We use 'fr_easy' instead of 'de_easy' because 'de' is already in cache
      // and wouldn't trigger the second fetch we want to test.
      await Language.applyTranslations("fr_easy");

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("falling back"),
      );
      // Ensure the second fetch call happened for the base language
      expect(global.fetch).toHaveBeenNthCalledWith(2, "/lang/fr.json");

      consoleWarnSpy.mockRestore();
    });

    test("updates specific attributes (placeholder) and HTML content", async () => {
      const mockData = {
        HTML_CONTENT: "<b>Bold</b>",
        PLACEHOLDER_TXT: "Type here",
      };
      // Manually set cache for 'en' to avoid fetching
      Language.__setTranslationsForTests("en", mockData);

      await Language.applyTranslations("en");

      const htmlEl = document.querySelector(
        '[data-translate-key="HTML_CONTENT"]',
      );
      const attrEl = document.querySelector(
        '[data-translate-key="PLACEHOLDER_TXT"]',
      );

      expect(htmlEl.innerHTML).toBe("<b>Bold</b>");
      expect(attrEl.getAttribute("placeholder")).toBe("Type here");
    });
  });

  describe("Event Listeners", () => {
    test("Easy language toggle switches between normal and easy", async () => {
      // Start at standard DE
      Language.__setTranslationsForTests("de", {});
      Language.initializeLanguageSwitcher();

      global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      const easyBtn = document.getElementById("easy-language-toggle");

      // Click: Go to easy
      await easyBtn.click();
      expect(global.fetch).toHaveBeenCalledWith("/lang/de_easy.json");
    });
  });
});
