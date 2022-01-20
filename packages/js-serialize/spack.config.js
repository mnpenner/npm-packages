const { config } = require("@swc/core/spack");

module.exports = config({
    target: 'node',
    entry: {
        jsSerialize: __dirname + "/index.ts",
    },
    output: {
        path: __dirname + "/dist",
    },
});
