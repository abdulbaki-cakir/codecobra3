import { resolve } from "path";
import { defineConfig } from "vite";
import handlebars from "vite-plugin-handlebars";
import { globSync } from "glob"; // <--- NEU: Importiert das Dateisuche-Tool
import { fileURLToPath } from "url"; // <--- NEU: Wird für die Pfade benötigt

// --- DAS IST DIE LÖSUNG FÜR OPTIMIERUNG 1 ---
// Definiert __dirname korrekt in einem ES-Modul
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// --- DAS IST DIE LÖSUNG FÜR OPTIMIERUNG 2 ---
// Findet automatisch alle .html-Dateien im Stammverzeichnis
const htmlInputs = Object.fromEntries(
  globSync("*.html").map((file) => [
    // Erstellt den Namen (z.B. 'index' aus 'index.html')
    file.slice(0, file.length - ".html".length),
    // Gibt den vollständigen Pfad an
    resolve(__dirname, file),
  ]),
);

export default defineConfig({
  plugins: [
    handlebars({
      // Verwendet jetzt die neue, robuste __dirname-Variable
      partialDirectory: resolve(__dirname, "src/partials"),
    }),
  ],
  build: {
    rollupOptions: {
      // Verwendet die automatisch erstellte Liste statt einer manuellen
      input: htmlInputs,
    },
  },
});
