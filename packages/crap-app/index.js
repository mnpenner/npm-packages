const Inquirer = require('inquirer');
const Chalk = require('chalk');
const FS = require('fs');
const {promisify} = require('util');
const validatePackageName = require("validate-npm-package-name");

async function ask(question) {
    return (await Inquirer.prompt({...question, name: '_'}))._
}

async function main(args) {
    const pkgName = await ask({
        message: "Package name?", validate: input => {
            const valid = validatePackageName(input);
            if(!valid.validForNewPackages) {
                return valid.errors.join(', ');
            }
            return true;
        }
    })

    console.log(pkgName);
}

main(process.argv.slice(2)).catch(err => {
    console.error(err.stack);
    process.exit(1);
})