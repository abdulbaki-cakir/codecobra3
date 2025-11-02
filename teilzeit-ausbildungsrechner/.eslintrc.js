module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },

  // 'standard' prüft die Code-Logik.
  // 'prettier' (als letztes) schaltet alle Stil-Regeln von 'standard' ab,
  // die mit Prettier in Konflikt stehen.
  extends: ["standard", "prettier"],

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },

  // Das 'rules'-Objekt ist jetzt leer.
  // ESLint (via 'standard') kümmert sich um die Logik-Fehler.
  // Prettier kümmert sich um die Formatierung.
  rules: {
    // Hier kommen nur noch spezielle Regeln rein, wenn du
    // von 'standard' oder 'prettier' abweichen WILLST.
    // Wir lassen es für den Moment leer.
  },
};
