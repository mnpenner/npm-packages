import js from '@eslint/js'
import type { ESLint as ESLintTypes } from 'eslint'
import globals from 'globals'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactCompiler from 'eslint-plugin-react-compiler'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import unusedImports from 'eslint-plugin-unused-imports'

const ignoredPackages = [
    'yamake',
    'svg-to-react-webpack-loader',
    'rollup-plugins',
    'react-datepicker',
    'react-combobox',
    'packdb',
]

const jsAndTsFiles = ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}']
const tsFiles = ['**/*.{ts,cts,mts,tsx}']

const browserPackageFiles = [
    'packages/crap-app/template/**/*.{js,jsx,ts,tsx}',
    'packages/jsxhtml/src/internal/dev.tsx',
    'packages/react-ajax-loader/**/*.{js,jsx,ts,tsx}',
    'packages/react-basic-inputs/**/*.{js,jsx,ts,tsx}',
    'packages/react-combobox/**/*.{js,jsx,ts,tsx}',
    'packages/react-datepicker/**/*.{js,jsx,ts,tsx}',
    'packages/react-external-store/**/*.{js,jsx,ts,tsx}',
    'packages/rerouter/**/*.{js,jsx,ts,tsx}',
    'packages/server-router/src/client/**/*.{js,jsx,ts,tsx}',
]

const reactPackageFiles = [
    'packages/crap-app/template/**/*.{js,jsx,ts,tsx}',
    'packages/react-ajax-loader/**/*.{js,jsx,ts,tsx}',
    'packages/react-basic-inputs/**/*.{js,jsx,ts,tsx}',
    'packages/react-combobox/**/*.{js,jsx,ts,tsx}',
    'packages/react-datepicker/**/*.{js,jsx,ts,tsx}',
    'packages/react-external-store/**/*.{js,jsx,ts,tsx}',
    'packages/rerouter/**/*.{js,jsx,ts,tsx}',
    'packages/ts-types/src/react.ts',
]

const serverPackageFiles = [
    '*.config.{js,cjs,mjs,ts,cts,mts}',
    'packages/base50/**/*.{js,jsx,ts,tsx}',
    'packages/base50/**/*.{cjs,mjs,cts,mts}',
    'packages/bun-plugin-react-compiler/**/*.{js,jsx,ts,tsx}',
    'packages/bun-server/**/*.{js,jsx,ts,tsx}',
    'packages/child-spawn/**/*.{js,jsx,ts,tsx}',
    'packages/classcat/**/*.{js,jsx,ts,tsx}',
    'packages/cli-api/**/*.{js,jsx,ts,tsx}',
    'packages/crap-app/*.{js,jsx,ts,tsx}',
    'packages/create-tslib/**/*.{js,jsx,ts,tsx}',
    'packages/http-helpers/**/*.{js,jsx,ts,tsx}',
    'packages/imut-utils/**/*.{js,jsx,ts,tsx}',
    'packages/is-type/**/*.{js,jsx,ts,tsx}',
    'packages/js-serialize/**/*.{js,jsx,ts,tsx}',
    'packages/jsxhtml/**/*.{js,jsx,ts,tsx}',
    'packages/jtilz/**/*.{js,jsx,ts,tsx}',
    'packages/logger/**/*.{js,jsx,ts,tsx}',
    'packages/merge-attrs/**/*.{js,jsx,ts,tsx}',
    'packages/mysql3/**/*.{js,jsx,ts,tsx}',
    'packages/neverject/**/*.{js,jsx,ts,tsx}',
    'packages/onemig/**/*.{js,jsx,ts,tsx}',
    'packages/ouid/**/*.{js,jsx,ts,tsx}',
    'packages/packdb/**/*.{js,jsx,ts,tsx}',
    'packages/podman/**/*.{js,jsx,ts,tsx}',
    'packages/progressbar/**/*.{js,jsx,ts,tsx}',
    'packages/register-pretty-error/**/*.{js,jsx,ts,tsx}',
    'packages/rerouter/**/*.{js,jsx,ts,tsx}',
    'packages/rollup-plugins/**/*.{js,jsx,ts,tsx}',
    'packages/server-router/**/*.{js,jsx,ts,tsx}',
    'packages/svg-to-react-webpack-loader/**/*.{js,jsx,ts,tsx}',
    'packages/svg2fonts/**/*.{js,jsx,ts,tsx}',
    'packages/ts-types/**/*.{js,jsx,ts,tsx}',
    'packages/uri-template/**/*.{js,jsx,ts,tsx}',
    'packages/uri-template/**/*.{cjs,mjs,cts,mts}',
    'packages/yamake/**/*.{js,jsx,ts,tsx}',
    '**/scripts/**/*.{js,cjs,mjs,ts,cts,mts}',
]

const reactHooksPlugin = reactHooks as unknown as ESLintTypes.Plugin

export default defineConfig([
    globalIgnores([
        ...ignoredPackages.map((p) => `packages/${p}/`),
        '**/.*',
        '**/dist/',
        '**/docs/',
        '**/ai/',
        '**/prompts/',
        '**/example/',
        '**/examples/',
        '**/node_modules/',
        '**/experimental/',
        '**/*.gen.*',
        'packages/bun-plugin-react-compiler/test/',
        'packages/ouid/src/timer-test*.mjs',
        'packages/ouid/test/test.js',
        'eslint-examples/',
        'scratch/',
        'templates/',
    ]),
    {
        name: 'global/recommended',
        files: jsAndTsFiles,
        extends: [js.configs.recommended, tseslint.configs.recommended],
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'unused-imports': unusedImports,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                ...globals.es2026,
            },
        },
        rules: {
            'require-await': 'warn',
            'prefer-const': ['warn', { destructuring: 'all' }],
            'no-control-regex': 'off',
            'prefer-rest-params': 'off',
            'no-constant-condition': ['error', { checkLoops: false }],
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    ignoreRestSiblings: true,
                    vars: 'local',
                    caughtErrors: 'all',
                    args: 'after-used',
                    varsIgnorePattern: '^(_|unused(?!\\p{Ll}))',
                    argsIgnorePattern: '^(_|unused(?!\\p{Ll}))',
                    reportUsedIgnorePattern: true,
                },
            ],
        },
    },
    {
        name: 'global/typescript',
        files: tsFiles,
        rules: {
            '@typescript-eslint/ban-ts-comment': [
                'warn',
                { 'ts-expect-error': 'allow-with-description' },
            ],
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-empty-interface': ['warn', { allowSingleExtends: true }],
            '@typescript-eslint/no-empty-object-type': [
                'warn',
                {
                    allowObjectTypes: 'always',
                    allowInterfaces: 'with-single-extends',
                },
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-inferrable-types': [
                'warn',
                { ignoreParameters: true, ignoreProperties: true },
            ],
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',
        },
    },
    {
        name: 'packages/browser',
        files: browserPackageFiles,
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-alert': 'warn',
        },
    },
    {
        name: 'packages/server-node-bun',
        files: serverPackageFiles,
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.bunBuiltin,
            },
        },
        rules: {
            'no-console': 'off',
        },
    },
    {
        name: 'packages/react',
        files: reactPackageFiles,
        plugins: {
            'react-compiler': reactCompiler,
            'react-hooks': reactHooksPlugin,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-compiler/react-compiler': 'error',
        },
    },
    {
        name: 'packages/react-refresh',
        files: reactPackageFiles.map((file) => file.replace('{js,jsx,ts,tsx}', '{jsx,tsx}')),
        rules: {
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        name: 'packages/rerouter/merged-config',
        files: ['packages/rerouter/**/*.{ts,tsx}'],
        rules: {
            'require-await': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    fixStyle: 'inline-type-imports',
                    disallowTypeAnnotations: false,
                },
            ],
        },
    },
])
