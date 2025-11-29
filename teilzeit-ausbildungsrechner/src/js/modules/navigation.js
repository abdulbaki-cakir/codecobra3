// Wir exportieren eine Funktion, die wir in main.js aufrufen können
export function initializeNavigation() {
  let lastScrollTop = 0; // Das "Gedächtnis" für die letzte Scroll-Position
  const header = document.querySelector("header");

  // Sicherheits-Check: Nur ausführen, wenn ein Header da ist
  if (!header) {
    console.warn("Autohide Header: <header> Element nicht gefunden.");
    return;
  }

  const headerHeight = header.offsetHeight; // Wie hoch ist der Header?
  const scrollThreshold = 10; // Ein kleiner Puffer, damit es nicht wackelt

  window.addEventListener(
    "scroll",
    function () {
      const currentScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Ignoriere kleine "Wackel-Scrolls"
      if (Math.abs(currentScrollTop - lastScrollTop) <= scrollThreshold) {
        return;
      }

      // 1. RUNTER SCROLLEN & WEIT GENUG VOM TOP WEG
      if (currentScrollTop > lastScrollTop && currentScrollTop > headerHeight) {
        // Füge die "hidden"-Klasse hinzu
        header.classList.add("header-hidden");
      }
      // 2. HOCH SCROLLEN
      else {
        header.classList.remove("header-hidden");
      }

      // Aktualisiere das "Gedächtnis"
      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    },
    false,
  );
}

// Modul: Steuert die Anker-Navigation im Footer über mehrere Seiten hinweg.
export function initializeFooterNavigation() {
  // Finde alle Links im Footer, die auf einen Anker (#) verweisen.
  const footerNavLinks = document.querySelectorAll('.site-footer a[href^="#"]');

  // Finde den Namen der aktuellen HTML-Datei (z.B. "index.html" oder "datenschutz.html")
  const currentPage = window.location.pathname.split("/").pop();

  footerNavLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      const targetId = this.getAttribute("href"); // z.B. "#hero-section"

      // Wenn wir NICHT auf der Startseite sind...
      if (currentPage !== "index.html" && currentPage !== "") {
        // ...verhindere das standardmäßige "Springen" auf der aktuellen Seite...
        event.preventDefault();

        // ...und leite stattdessen zur Startseite mit dem passenden Anker weiter.
        window.location.href = `index.html${targetId}`;
      }
    });
  });
}

// Modul: Stellt die Scroll-Funktion bereit.
// Wird vom calculatorController aufgerufen, wenn die Validierung erfolgreich war.
export function scrollToCalculator() {
  const scrollTarget = document.getElementById("calculator-section");
  if (!scrollTarget) return;

  // Verzögerung, um sicherzustellen, dass DOM-Änderungen abgeschlossen sind.
  setTimeout(() => {
    scrollTarget.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 150);
}
