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

    await copyDir(Path.join(__dirname, 'template'), pkgName);

    await FSP.writeFile(Path.join(pkgName, 'LICENSE'), `The MIT License (MIT)

Copyright (c) ${(new Date).getFullYear()} ${OS.userInfo().username}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
`)

    await FSP.writeFile(Path.join(pkgName, 'README.md'), `# ${pkgName}
    
Created with [\`crap-app\`](https://yarnpkg.com/en/package/crap-app).

## Getting started

\`\`\`sh
make start
\`\`\`
`)

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
                "awesome-typescript-loader": "^5",
                "babel-plugin-emotion": "^9",
                "html-webpack-plugin": "^3",
                "react-hot-loader": "^4",
                "ts-node": "^7",
                "typescript": "^3",
                "webpack": "^4",
                "webpack-command": "^0.4.1",
                "webpack-serve": "^2.0.2"
            },
            dependencies: {
                "react": "^16",
                "react-dom": "^16",
                "emotion": "^9",
                "react-emotion": "^9"
            }
        }, null, 4)
    );

    ChildProc.spawn('yarn', ['--production=false'], {cwd: Path.resolve(pkgName), stdio: 'inherit'})//yarn
}

main(process.argv.slice(2)).catch(err => {
    console.error(err.stack);
    process.exit(1);
})