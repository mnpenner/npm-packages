import js from "@eslint/js"
import {defineConfig, globalIgnores} from "eslint/config"
import globals from "globals"
import tseslint from "typescript-eslint"
import unusedImports from "eslint-plugin-unused-imports"

export default defineConfig([
    globalIgnores([
        // https://eslint.org/docs/latest/use/configure/ignore#ignoring-directories
        '**/dist/',
        '**/node_modules/',
        '**/*.gen.*',
    ]),
    {
        files: ["src/**/*.ts"],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
        ],
        plugins: {
            'unused-imports': unusedImports,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            globals: globals.es2026,
        },
        rules: {
            'require-await': 'warn',
            'prefer-const': [
                'warn',
                {destructuring: 'all'},
            ],
            '@typescript-eslint/ban-ts-comment': [
                'warn',
                {'ts-expect-error': 'allow-with-description'},
            ],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-inferrable-types': [
                'warn',
                {ignoreParameters: true, ignoreProperties: true},
            ],
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'no-control-regex': 'off',
            'prefer-rest-params': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-interface': [
                'warn',
                {allowSingleExtends: true},
            ],
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    ignoreRestSiblings: true,
                    vars: 'all',
                    caughtErrors: 'all',
                    args: 'after-used',
                    varsIgnorePattern: '^(_|unused)',
                    argsIgnorePattern: '^(_|unused)',
                    reportUsedIgnorePattern: true,
                },
            ],
            'no-constant-condition': [
                'error',
                {checkLoops: false},
            ],
            '@typescript-eslint/no-empty-object-type': [
                'warn',
                {allowObjectTypes: 'always'},
            ],
        },
    },
])
