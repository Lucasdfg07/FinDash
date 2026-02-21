import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // External dependencies & dev tools:
    ".aios-core/**",
    ".claude/**",
    "node_modules/**",
    "coverage/**",
    "e2e/**",
    "prisma/**",
  ]),
  {
    rules: {
      // Allow setState in effects for resetting/syncing state with dependencies
      // This is a common and valid React pattern
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: [
      "src/lib/redis-pubsub.ts",
      "src/lib/audit-logger.ts",
      "src/lib/logger.ts",
      "src/lib/auth-utils.ts",
      "src/lib/*.test.ts",
      "src/components/charts/*.tsx",
    ],
    rules: {
      // These files interact with external APIs and packages that return untyped data
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    rules: {
      // Variables prefixed with _ are intentionally unused (error handlers, API compatibility)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
