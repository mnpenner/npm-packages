/** @type (import('eslint').Linter.ConfigType) */
module.exports = {
    root: true,
    env: {browser: false, es2020: true, node: true},
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['eslint-plugin-unused-imports'],
    settings: {},
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
        "@typescript-eslint/consistent-type-imports": "error",
        '@typescript-eslint/no-inferrable-types': [
            'warn',
            {ignoreParameters: true, ignoreProperties: true}
        ],
        '@typescript-eslint/no-this-alias': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-control-regex': 'off',
        'prefer-rest-params': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-interface': [
            'warn',
            {'allowSingleExtends': true},
        ],
        '@typescript-eslint/no-unused-vars': "off",
        "unused-imports/no-unused-imports": "error",
        "unused-imports/no-unused-vars": [
            "warn",
            {
                "ignoreRestSiblings": true,
                "vars": "all",
                "caughtErrors": "all",
                "args": "after-used",
                "varsIgnorePattern": "^__",
                "argsIgnorePattern": "^__",
                "reportUsedIgnorePattern": true,
            },
        ],
        'no-constant-condition': [
            'error',
            {checkLoops: false},
        ],
        '@typescript-eslint/no-empty-object-type': [
            'warn',
            {allowObjectTypes: 'always'},
        ]
    },
}
