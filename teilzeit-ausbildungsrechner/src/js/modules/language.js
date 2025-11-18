// Modul: Enthält die Logik für das Öffnen/Schließen des Dropdowns.

/**
 * Aktiviert das Sprach-Dropdown: Öffnet/schließt es per Klick und schließt es bei Klick daneben.
 */
function initializeLanguageSwitcher() {
  const toggleButton = document.getElementById("language-toggle");
  const menu = document.getElementById("language-menu");
  const languageOptions = document.querySelectorAll(".language-option");

  if (!toggleButton || !menu) {
    console.warn("Dropdown-Elemente (toggle/menu) nicht gefunden.");
    return;
  }

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

// Exportiere die Funktion, damit main.js sie importieren kann
export { initializeLanguageSwitcher };
