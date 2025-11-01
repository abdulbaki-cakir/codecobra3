import { resolve } from 'path';
import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';

export default defineConfig({
    plugins: [
        handlebars({
            // Sagt dem Plugin, wo deine Partials liegen
            partialDirectory: resolve(__dirname, 'src/partials'),
        }),
    ],
    build: {
        rollupOptions: {
            // Listet alle deine HTML-Seiten auf
            input: {
                main: resolve(__dirname, 'index.html'),
                // Füge hier weitere Seiten hinzu, falls du welche hast
            },
        },
    },
});