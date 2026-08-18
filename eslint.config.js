import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Wires the runtime dependency graph, so it is allowed to reach into module
 * internals. Everything else must go through a module's public API.
 */
const compositionRoot = [
  "src/main.ts",
  "src/worker.ts",
  "src/seed.ts",
  "src/app/**",
  "src/routes/**",
  "src/seed/**",
];

const publicApiOnly = {
  group: ["@/modules/*/**", "!@/modules/*/index.js"],
  message:
    "Import another module through its public API (@/modules/<name>/index.js). Inside a module use relative paths.",
};

const noModulesFromInfrastructure = {
  group: ["@/modules/**"],
  message:
    "core/ and shared/ are infrastructure and must not depend on feature modules. Invert the dependency with an interface.",
};

export default tseslint.config(
  { ignores: ["dist", "coverage", "storage", "db/migrations"] },

  {
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,

  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  {
    files: ["**/*.ts"],
    rules: {
      "no-console": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { arguments: false } },
      ],
      "@typescript-eslint/return-await": ["error", "always"],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true, ignoreVoidReturningFunctions: true },
      ],
    },
  },

  {
    files: ["src/**/*.ts"],
    ignores: [...compositionRoot, "src/core/**", "src/shared/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [publicApiOnly] }],
    },
  },

  {
    files: ["src/core/**/*.ts", "src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [noModulesFromInfrastructure] },
      ],
    },
  },

  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  {
    files: ["src/seed.ts", "src/seed/**", "scripts/**"],
    rules: {
      "no-console": "off",
    },
  },
);
