import js from "@eslint/js"
import { defineConfig } from "eslint/config"
import prettierRecommendedConfig from "eslint-plugin-prettier/recommended"
import reactHooks from "eslint-plugin-react-hooks"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import sonarjs from "eslint-plugin-sonarjs"
import unicorn from "eslint-plugin-unicorn"
import globals from "globals"
import typescriptEslint from "typescript-eslint"

const projects = ["./tsconfig.eslint.json"]

export default defineConfig([
    {
        ignores: ["**/node_modules/**", "**/dist/**"],
    },
    prettierRecommendedConfig,
    js.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        extends: [...typescriptEslint.configs.recommended, ...typescriptEslint.configs.recommendedTypeChecked],
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    sonarjs.configs.recommended,
    unicorn.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
        plugins: {
            "simple-import-sort": simpleImportSort,
        },
        rules: {
            "simple-import-sort/exports": "error",
            "simple-import-sort/imports": [
                "error",
                {
                    groups: [[String.raw`^@?\w`, "^~", "^.", String.raw`^\u0000`]],
                },
            ],

            "unicorn/filename-case": [
                "error",
                {
                    cases: {
                        camelCase: true,
                        pascalCase: true,
                    },
                },
            ],
            "unicorn/no-null": "off",

            "sonarjs/function-return-type": "off",
        },
    },
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2025,
            },
            parserOptions: {
                project: projects,
            },
        },
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
    },
])
