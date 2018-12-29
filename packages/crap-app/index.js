#!/usr/bin/env node
const Inquirer = require('inquirer');
const Chalk = require('chalk');
const FSP = require('fs').promises;
const ChildProc = require('child_process');
const {promisify} = require('util');
const validatePackageName = require("validate-npm-package-name");
const Path = require('path');
const jsSerialize = require('js-serialize');
const OS = require('os');
// const mkdir = promisify(FS.mkdir);
// const writeFile = promisify(FS.writeFile);

async function ask(question) {
    return (await Inquirer.prompt({...question, name: '_'}))._
}

async function* readDirR(path) {
    const entries = await FSP.readdir(path, {withFileTypes: true});
    for(let entry of entries) {
        const fullPath = Path.join(path, entry.name);
        if(entry.isDirectory()) {
            yield* readDirR(fullPath);
        } else {
            yield fullPath;
        }
    }
}

async function copyDir(src, dest) {
    const entries = await FSP.readdir(src, {withFileTypes: true});
    // await FSP.mkdir(dest);
    for(let entry of entries) {
        const srcPath = Path.join(src, entry.name);
        const destPath = Path.join(dest, entry.name);
        if(entry.isDirectory()) {
            await FSP.mkdir(destPath);
            await copyDir(srcPath, destPath);
        } else {
            await FSP.copyFile(srcPath, destPath);
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
    await FSP.mkdir(outputDir);

    if(license !== 'UNLICENSED') {
        const licenseText = await FSP.readFile(Path.join(__dirname, 'licenses', license), {encoding: 'utf8'});
        await FSP.writeFile(Path.join(outputDir, 'LICENSE'), replaceMulti(licenseText, {
            '<year>': (new Date).getFullYear(),
            '<owner>': OS.userInfo().username,
            '<project>': pkgName,
        }))
    }

    await FSP.writeFile(Path.join(outputDir, 'package.json'), JSON.stringify({
            name: pkgName,
            version: '0.1.0',
            license: license,
            private: license === 'UNLICENSED' || undefined,
            // scripts: {
            //     "start": "NODE_ENV=development webpack-serve"
            // },
            devDependencies: {
                "@babel/core": "^7.1",
                "@gfx/zopfli": "^1",
                "@types/node": "^10",
                "@types/react": "^16",
                "@types/react-dom": "^16",
                "@types/react-router": "^4",
                "@types/react-router-dom": "^4",
                "babel-loader": "^8",
                "babel-plugin-emotion": "^9",
                "compression-webpack-plugin": "^2",
                "file-loader": "^2",
                "html-webpack-plugin": "^3",
                "react-hot-loader": "^4",
                "react-router": "^4",
                "react-router-dom": "^4",
                "ts-loader": "^5",
                "ts-node": "^7",
                "typescript": "^3",
                "url-loader": "^1",
                "webpack": "^4",
                "webpack-cli": "^3",
                "webpack-dev-server": "^3",
            },
            dependencies: {
                "emotion": "^9",
                "react": "^16",
                "react-dom": "^16",
                "react-emotion": "^9",
            }
        }, null, 4)
    );

    await passthru('yarn', ['install','--production=false','--audit'], {cwd: outputDir})
    await copyDir(Path.join(__dirname, 'template'), outputDir); // create .yarnrc *after* installing for the first time; https://github.com/yarnpkg/yarn/issues/6857
    
    console.log(`\n${Chalk.cyan(pkgName)} created. Run ${Chalk.white.bgBlack(`cd ${pkgName}; make start`)} to get started.`)

    // const sslDir = Path.join(outputDir,'ssl'); 
    // await FSP.mkdir(sslDir)
    // ChildProc.spawn('openssl', ['req','-x509','-nodes','-days','365','-newkey','rsa:2048','-keyout','cert.key','-out','cert.pem','-config',Path.resolve('cert.ini'),'-sha256'], {cwd: sslDir, stdio: 'inherit'})
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