// https://github.com/facebook/jest/blob/3701b135e00912645c5fe0665ed0d70f528d6f45/examples/typescript/preprocessor.js

const tsc = require('typescript');
const tsConfig = require('./tsconfig.json');

module.exports = {
    process(src, path) {
        if (path.endsWith('.ts') || path.endsWith('.tsx')) {
            return tsc.transpile(src, tsConfig.compilerOptions, path, []);
        }
        return src;
    },
};