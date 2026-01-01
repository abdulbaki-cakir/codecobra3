
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
