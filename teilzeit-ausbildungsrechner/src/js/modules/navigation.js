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
        // Entferne die "hidden"-Klasse
        header.classList.remove("header-hidden");
      }

      // Aktualisiere das "Gedächtnis"
      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    },
    false,
  );
}

// --- NEU INTEGRIERT ---

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

// Modul: Sorgt dafür, dass der Rechner bei Schrittwechseln nach oben scrollt.
export function initializeCalculatorScrolling() {
  // Stabileres Ziel: Wir zielen auf die gesamte Rechner-Sektion.
  const scrollTarget = document.getElementById("calculator-section");
  const navigationButtons = document.querySelectorAll(
    "#next-btn-1, #back-btn-2, #next-btn-2, #back-btn-3",
  );

  // Funktion nur ausführen, wenn die benötigten Elemente auf der Seite sind.
  if (!scrollTarget || navigationButtons.length === 0) {
    return;
  }

  function scrollToCalculatorTop() {
    // Eine leicht erhöhte Verzögerung (150ms), um sicherzustellen, dass
    // alle DOM-Änderungen abgeschlossen sind.
    setTimeout(() => {
      scrollTarget.scrollIntoView({
        behavior: "smooth", // 'auto' bewirkt einen sofortigen Sprung ohne Animation.
        block: "start",
      });
    }, 150);
  }

  navigationButtons.forEach((button) => {
    button.addEventListener("click", scrollToCalculatorTop);
  });
}
