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
    await FSP.mkdir(dest);
    for(let entry of entries) {
        const srcPath = Path.join(src, entry.name);
        const destPath = Path.join(dest, entry.name);
        if(entry.isDirectory()) {
            // await FSP.mkdir(destPath);
            await copyDir(srcPath, destPath);
        } else {
            await FSP.copyFile(srcPath, destPath);
        }
    }
}

async function main(args) {
    let pkgName;

    if(args.length) {
        pkgName = args[0];
        const valid = validatePackageName(pkgName);
        if(!valid.validForNewPackages) {
            console.error(valid.errors.map(x => `- ${x}`).join("\n"));
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
    }

    const outputDir = Path.resolve(pkgName);
    
    await copyDir(Path.join(__dirname, 'template'), outputDir);
    

    await FSP.writeFile(Path.join(pkgName, 'package.json'), JSON.stringify({
            name: pkgName,
            version: '0.1.0',
            license: "MIT",
            // scripts: {
            //     "start": "NODE_ENV=development webpack-serve"
            // },
            devDependencies: {
                "@babel/core": "^7.1",
                "@types/node": "^10",
                "@types/react": "^16",
                "@types/react-dom": "^16",
                "@types/react-router": "^4",
                "@types/react-router-dom": "^4",
                "awesome-typescript-loader": "^5",
                "babel-plugin-emotion": "^9",
                "html-webpack-plugin": "^3",
                "react-hot-loader": "^4",
                "ts-node": "^7",
                "typescript": "^3",
                "webpack": "^4",
                "webpack-cli": "^3",
                "webpack-dev-server": "^3",
                "react-router": "^4",
                "react-router-dom": "^4"
            },
            dependencies: {
                "react": "^16",
                "react-dom": "^16",
                "emotion": "^9",
                "react-emotion": "^9",
            }
        }, null, 4)
    );

    ChildProc.spawn('yarn', ['--production=false'], {cwd: outputDir, stdio: 'inherit'})
    
    // const sslDir = Path.join(outputDir,'ssl'); 
    // await FSP.mkdir(sslDir)
    // ChildProc.spawn('openssl', ['req','-x509','-nodes','-days','365','-newkey','rsa:2048','-keyout','cert.key','-out','cert.pem','-config',Path.resolve('cert.ini'),'-sha256'], {cwd: sslDir, stdio: 'inherit'})
}

main(process.argv.slice(2)).catch(err => {
    console.error(err.stack);
    process.exit(1);
})
