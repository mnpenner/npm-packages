const getFiles = require('recursive-readdir');
const Path = require('path');
const FS = require('fs');
const target = process.argv[2];
const srcDir = `${__dirname}/src`;

getFiles(srcDir, (err, files) => {
    if(err) throw err;
    let lines = [];
    for(let f of files) {
        let m = /\.(\w+)\.js/.exec(f);
        if(!m || m[1] === target) {
            let p = Path.relative(srcDir, f);
            p = p.slice(0,p.indexOf('.'));
            lines.push(`export * from ${JSON.stringify(`./${p}`)};`);
        }
    }
    FS.writeFileSync(`${srcDir}/index.${target}.js`, lines.join("\n"));
});
