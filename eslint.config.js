import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "web/dist/**",
      "web/src/**",
      "node_modules/**",
      "packages/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
      "catalog/**"
    ]
  },
  js.configs.recommended,
  {
    files: [
      "web/scripts/**/*.mjs",
      "web/site.config.mjs",
      "web/browser/**/*.mjs",
      "scripts/**/*.mjs",
      "*.mjs",
      "tests/node/**/*.mjs"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-console": "off"
    }
  }
];
