# Entwickler-README – Tests & Coverage

Dieses Projekt nutzt **Jest** für Unit- und DOM-Tests (über **jsdom**).

---

## Voraussetzungen

- **Node.js**
- **npm**
- Abhängigkeiten installiert:

```bash
npm install
```

---

## Tests ausführen

### Alle Tests starten

```bash
npm test
```

Entspricht dem Script:

```json
"test": "jest"
```

---

### Tests mit Coverage ausführen

```bash
npm run test:coverage
```

Entspricht dem Script:

```json
"test:coverage": "jest --coverage"
```

Ergebnis:
- Coverage-Zusammenfassung im Terminal
- HTML-Report unter:

```text
/coverage/lcov-report/index.html
```

---

## Welche Arten von Tests gibt es?

### 1. Controller-Tests
- Testen den **Ablauf / Flow**
- View, Service, Validation und Navigation werden **gemockt**
- Fokus:
  - Navigation zwischen Steps
  - Validierungen
  - Aufruf von Berechnung und Rendering

Beispiel:
```js
jest.mock("../../js/modules/calculatorView.js", () => mockView);
jest.mock("../../js/modules/calculatorService.js", () => mockService);
```

---

### 2. View- / DOM-Tests
- Testen **UI-Logik und DOM-Manipulation**
- Laufen mit `jsdom`
- DOM wird im Test manuell aufgebaut:

```js
document.body.innerHTML = `
  <button id="next-btn-1"></button>
  <div id="progress-line"></div>
`;
```

- Externe Abhängigkeiten werden gestubbt:
  - `Chart.js`
  - SVG-Icons
  - Übersetzungen (`language.js`)

---

## Test-Setup (wichtig zu wissen)

### jsdom aktivieren
DOM-Tests nutzen:

```js
/** @jest-environment jsdom */
```

Damit stehen `document`, `window`, Events etc. zur Verfügung.

---

### Module Mocking
Um Tests isoliert zu halten, werden Abhängigkeiten gemockt:

- View
- Service
- Validation
- Navigation
- Language / i18n

So kann gezielt geprüft werden:
- **ob** eine Funktion aufgerufen wurde
- **mit welchen Parametern**
- **in welcher Reihenfolge**

---

### beforeEach – Standard-Setup
Fast jeder Test nutzt:

```js
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  document.body.innerHTML = `...`;
});
```

Warum?
- Sauberer Zustand pro Test
- Keine Seiteneffekte zwischen Tests
- Frischer DOM

---

## Nützliche Befehle

### Einzelne Testdatei ausführen
```bash
npx jest calculatorController
```

### Watch Mode (lokale Entwicklung)
```bash
npx jest --watch
```

