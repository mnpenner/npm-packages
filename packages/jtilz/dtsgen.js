#!/usr/bin/env node
const {default: generate} = require('dts-generator');
const Path = require('path');

generate({
    name: 'jtilz',
    project: __dirname,
    out: 'dist/jtilz.d.ts',
    moduleResolution: 'node',
    resolveModuleId: ({currentModuleId}) => {
        const basename = Path.basename(currentModuleId, '.ts');
        const dirname = Path.dirname(currentModuleId);
        if(basename === 'index' || basename === 'index.web' || basename === 'index.node') {
        
            // console.log(currentModuleId,dirname);
            return dirname !== '.' ? `jtilz/_${dirname}` : 'jtilz';
        }
        return `jtilz/_${currentModuleId}`;
    }
});