#!/usr/bin/env node
const Inquirer = require('inquirer');
const Chalk = require('chalk');
const FS = require('fs');
const ChildProc = require('child_process');
const {promisify} = require('util');
const validatePackageName = require("validate-npm-package-name");
const Path = require('path');
// const jsSerialize = require('js-serialize');
const OS = require('os');

const mkdir = promisify(FS.mkdir);
const readFile = promisify(FS.readFile);
const writeFile = promisify(FS.writeFile);
const readDir = promisify(FS.readdir);
const copyFile = promisify(FS.copyFile);

async function ask(question) {
    return (await Inquirer.prompt({...question, name: '_'}))._
}

// async function* readDirR(path) {
//     const entries = await readDir(path, {withFileTypes: true});
//     for(let entry of entries) {
//         const fullPath = Path.join(path, entry.name);
//         if(entry.isDirectory()) {
//             yield* readDirR(fullPath);
//         } else {
//             yield fullPath;
//         }
//     }
// }

async function copyDir(src, dest) {
    const entries = await readDir(src, {withFileTypes: true});
    await mkdir(dest);
    for(let entry of entries) {
        const srcPath = Path.join(src, entry.name);
        const destPath = Path.join(dest, entry.name);
        if(entry.isDirectory()) {
            // await mkdir(destPath);
            await copyDir(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}

async function main(args) {
    let pkgName, license = 'UNLICENSED', copyrightHolder;

    if(args.length) {
        pkgName = args[0];
        const valid = validatePackageName(pkgName);
        if(!valid.validForNewPackages) {
            const errors = [...valid.errors || [], ...valid.warnings || []];
            console.error(errors.length === 1 ? errors[0] : errors.map(x => `- ${x}`).join("\n"));
            process.exit(1);
        }
    } else {
        pkgName = await ask({
            message: "Package name?",
            validate: input => {
                const valid = validatePackageName(input);
                if(!valid.validForNewPackages) {
                    return valid.errors.join(', ');
                }
                return true;
            },
            default: args[0]
        });

        license = await ask({
            message: "License?",
            type: 'list',
            choices: [
                // yarn licenses list
                'UNLICENSED',
                'MIT',
                'ISC',
                'Apache-2.0',
                'BSD-2-Clause',
            ],
            // default: 'UNLICENSED'
        });

        if(license !== 'UNLICENSED') {
            copyrightHolder = await ask({
                message: "Copyright holder?",
                default: OS.userInfo().username
            });
        }
    }

    const outputDir = Path.resolve(pkgName);
    await copyDir(Path.join(__dirname, 'template'), outputDir);

    if(license !== 'UNLICENSED') {
        const licenseText = await readFile(Path.join(__dirname, 'licenses', license), {encoding: 'utf8'});
        await writeFile(Path.join(outputDir, 'LICENSE'), replaceMulti(licenseText, {
            '<year>': (new Date).getFullYear(),
            '<owner>': copyrightHolder,
            '<project>': pkgName,
        }))
    }

    await writeFile(Path.join(outputDir, 'package.json'), JSON.stringify({
            name: pkgName,
            version: '0.1.0',
            license: license,
            private: license === 'UNLICENSED' || undefined,
            // scripts: {
            //     "start": "NODE_ENV=development webpack-serve"
            // },
            devDependencies: {
                "@babel/core": "^7",
                "@babel/plugin-proposal-class-properties": "^7",
                "@babel/plugin-syntax-dynamic-import": "^7",
                "@babel/plugin-transform-react-constant-elements": "^7",
                "@babel/preset-env": "^7",
                "@babel/preset-react": "^7",
                "@babel/preset-typescript": "^7",
                "@gfx/zopfli": "^1",
                "@types/node": "^10",
                "@types/reach__router": "^1.2",
                "@types/react": "^16.8",
                "@types/react-dom": "^16.8",
                "@types/styled-components": "^4", // TODO: upgrade to ^5 when it's released
                "autoprefixer": "^9",
                "babel-loader": "^8",
                "babel-plugin-webpack-chunkname": "^1",
                "compression-webpack-plugin": "^2",
                "core-js": "^3",
                "css-loader": "^2",
                "cssnano": "^4",
                "file-loader": "^2",
                "html-webpack-plugin": "^3",
                "less": "^3",
                "less-loader": "^4",
                "mini-css-extract-plugin": "^0.5",
                "postcss-loader": "^3",
                "react-hot-loader": "^4",
                "style-loader": "^0.23",
                "svg-to-react-webpack-loader": "^0.1",
                "ts-node": "^7",
                "typescript": "^3",
                "url-loader": "^1",
                "webpack": "^4",
                "webpack-cli": "^3",
                "webpack-dev-server": "^3",
                // "copy-webpack-plugin": "^4",
                "babel-plugin-styled-components": "^1",
                "terser-webpack-plugin": "^2.1",
                "clean-webpack-plugin": "^3",
            },
            dependencies: {
                "react": "^16.8",
                "react-is": "^16.8",
                "react-dom": "^16.8",
                "@hot-loader/react-dom": "^16.8",
                // "react-dom": "npm:@hot-loader/react-dom", // https://github.com/gaearon/react-hot-loader#react--dom  https://stackoverflow.com/a/54816859/65387
                "@reach/router": "^1.2", // FIXME: not very happy with Reach Router
                'styled-components': '^5.0.0-beta',
                "stylis": "^3.5", // https://www.npmjs.com/package/stylis -- dependency of styled-components
            }
        }, null, 4)
    );

    await passthru('yarn', ['install','--production=false','--audit'], {cwd: outputDir})
    // create .yarnrc *after* installing for the first time; https://github.com/yarnpkg/yarn/issues/6857

    const sslDir = Path.join(outputDir,'ssl');
    await mkdir(sslDir)
    ChildProc.spawn('openssl', ['req','-x509','-nodes','-days','365','-newkey','rsa:2048','-keyout','cert.key','-out','cert.pem','-config',Path.resolve('cert.ini'),'-sha256'], {cwd: sslDir, stdio: 'inherit'})

    console.log(`\n${Chalk.cyan(pkgName)} created. Run ${Chalk.white.bgBlack(`cd ${pkgName}; make dev`)} to get started.`)
}

main(process.argv.slice(2)).catch(err => {
    console.error(err.stack);
    process.exit(1);
})

function passthru(cmd,args,opts) {
    return new Promise((resolve,reject) => {
        const proc = ChildProc.spawn(cmd,args,{stdio:'inherit',...opts});
        proc.on('close', code => {
            if(code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        })
    })
}

function replaceMulti(source, dict) {
    const re = new RegExp(Object.keys(dict).map(escapeRegExp).join('|'), 'gui');
    return source.replace(re, m => dict[m])
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}