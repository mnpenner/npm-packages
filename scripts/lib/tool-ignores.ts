export const toolIgnoreGlobs = [
    '**/*.gen.*',
    '**/.*',
    '**/ai/',
    '**/dist/',
    '**/docs/',
    '**/experimental/',
    '**/node_modules/',
    '**/prompts/',
    'deprecated/',
    'eslint-examples/',
    'packages/bun-plugin-react-compiler/test/',
    'packages/ouid/src/timer-test*.mjs',
    'packages/ouid/test/test.js',
    'packages/packdb/',
    'packages/react-combobox/',
    'packages/react-datepicker/',
    'packages/rollup-plugins/',
    'packages/svg-to-react-webpack-loader/',
    'packages/yamake/',
    'packages/onemig/',
    'scratch/',
    'templates/',
]

export const typecheckIgnoreGlobs = toolIgnoreGlobs.map((pattern) =>
    pattern.endsWith('/') ? `${pattern}**` : pattern,
)
