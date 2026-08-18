import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "web/dist/**",
      // Unit tests use node:test + JSON import attributes and are excluded from
      // web/tsconfig; keep out of projectService lint (policy: app sources only).
      "web/src/**/*.test.ts",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "public/**",
      "catalog/**",
      "goals/**"
    ]
  },
  js.configs.recommended,
  {
    files: [
      "web/scripts/**/*.mjs",
      "web/site.config.mjs",
      "web/vite.config.ts",
      "web/browser/**/*.mjs",
      "scripts/**/*.mjs",
      "packages/catalog-core/**/*.{js,mjs}",
      "*.mjs"
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
  },
  // App TypeScript/TSX (previously ignored entirely)
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ["web/src/**/*.{ts,tsx}"]
  })),
  {
    files: ["web/src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // High-signal baseline; avoid flood of stylistic noise
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": "off",
      "no-undef": "off"
    }
  }
);
