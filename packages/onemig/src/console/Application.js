// import findUp from 'find-up';
import Chalk from 'chalk';
import dump from '../dump';
import Path from 'path';

export default class Application {
    
    constructor(options) {
        Object.assign(this, {
            name: '',
            version: '',
            commands: [],
        }, options);
    }
    
    add(cmd) {
        this.commands.push(cmd);
    }
    
    async run(argv=process.argv) {
        const [nodeExe, scriptName, cmdName, ...rawArgs] = argv;
        
        if(!cmdName) {
            await this.showHelp(scriptName);
        } else {
            const commands = await Promise.all(this.commands);
            const cmd = commands.find(cmd => cmd.name === cmdName);
            await cmd.execute([], {});
        }
    }
    
    async showHelp(scriptName) {
        let {name,version} = this;
        const commands = await Promise.all(this.commands);
        
        if(!name || !version) {
            const pkg = require(`${__dirname}/../../package.json`);
            if(!name) {
                name = pkg.name;
            }
            if(!version) {
                version = pkg.version;
            }
        }

        console.log(`${name} ${Chalk.green(version)}`);
        console.log();
        console.log(Chalk.yellow('Usage:'));
        console.log(`  ${Chalk.green(process.argv0+' '+Path.relative(process.cwd(),scriptName))} <command> [arguments] [options]`);
        console.log();
        console.log(Chalk.yellow('Available commands:'));
        
        
        const targetLength = Math.max(...commands.map(cmd => cmd.name.length)) + 2;
        for(let {_options: cmd} of commands) {
            console.log(`  ${Chalk.green(cmd.name.padEnd(targetLength))} ${cmd.description}`);
        }
    }
}