import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["public/**", "node_modules/**", "playwright-report/**", "test-results/**"]
  },
  js.configs.recommended,
  {
    files: ["web/**/*.mjs", "*.mjs", "*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      "no-console": "off"
    }
  }
];
