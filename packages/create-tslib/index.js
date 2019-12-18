#!/usr/bin/env node
const Inquirer = require('inquirer');
const Chalk = require('chalk');
const FS = require('fs');
const ChildProc = require('child_process');
const {promisify} = require('util');
const validatePackageName = require("validate-npm-package-name");
const Path = require('path');
const OS = require('os');

const mkdir = promisify(FS.mkdir);
const readFile = promisify(FS.readFile);
const writeFile = promisify(FS.writeFile);
const readDir = promisify(FS.readdir);
const copyFile = promisify(FS.copyFile);

async function ask(question) {
    return (await Inquirer.prompt({...question, name: '_'}))._
}

async function copyDir(src, dest) {
    const entries = await readDir(src, {withFileTypes: true});
    await mkdir(dest);
    for(let entry of entries) {
        const srcPath = Path.join(src, entry.name);
        const destPath = Path.join(dest, entry.name);
        if(entry.isDirectory()) {
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
                "@types/node": "^12",
                "typescript": "^3.7",
                "@babel/node": "^7.7",
                "@babel/core": "^7.7",
                "@babel/cli": "^7.7",
                "@babel/preset-typescript": "^7.7",
                "@babel/plugin-proposal-nullish-coalescing-operator": "^7.7",
                "@babel/plugin-syntax-numeric-separator": "^7.7",
                "@babel/plugin-proposal-optional-chaining": "^7.7",
                "@babel/plugin-syntax-bigint": "^7.7",
                "@babel/plugin-syntax-nullish-coalescing-operator": "^7.7",
                "@babel/preset-env": "^7.7",
                "source-map-support": "^0.5"
            },
            dependencies: {
                "dotenv": "^8"
            }
        }, null, 4)
    );

    await passthru('yarn', ['install','--production=false','--audit'], {cwd: outputDir})
    // create .yarnrc *after* installing for the first time; https://github.com/yarnpkg/yarn/issues/6857

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
