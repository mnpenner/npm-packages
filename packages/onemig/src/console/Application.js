// import findUp from 'find-up';
import Chalk from 'chalk';
import dump from '../dump';
import Path from 'path';
import {consts,access} from '../util/fs';
import InputOption from './InputOption';
import {toIter} from '../util/array';

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
        } else if(cmdName === 'help') {
            throw new Error(`"${cmdName}" not implemented`);
        } else {
            const commands = await Promise.all(this.commands);
            const cmd = commands.find(cmd => cmd.name === cmdName);
            const args = [];
            const opts = {};
            const longOpts = new Map();
            const shortOpts = new Map();
            for(let opt of cmd.options) {
                if(!opt.name) throw new Error("Option is missing a name");
                if(!opt.key) opt.key = opt.name || opt.alias;
                if(opt.default !== undefined) {
                    opts[opt.key] = opt.default;
                }
                longOpts.set(opt.name,opt);
                for(const alias of toIter(opt.alias)) {
                    shortOpts.set(alias,opt);
                }
            }
            for(let i=0; i<rawArgs.length; ++i) {
                const arg = rawArgs[i];
                if(arg === '--') {
                    args.push(...rawArgs.slice(i+1));
                    break;
                }
                if(arg === '-') {
                    args.push(process.stdin);
                } else if(arg.startsWith('--')) {
                    const optName = arg.slice(2);
                    const opt = longOpts.get(optName);
                    if(!opt) {
                        throw new Error(`Unrecognized option: ${arg}`)
                    }
                    if((opt.value&InputOption.Required)===InputOption.Required) {
                        if((opts[opt.key]=rawArgs[++i])===undefined) {
                            throw new Error(`Value is required for ${arg}`);
                        }
                    }
                } else if(arg.startsWith('-')) {
                    const optName = arg.slice(1);
                    const opt = shortOpts.get(optName);
                    if(!opt) {
                        throw new Error(`Unrecognized option: ${arg}`)
                    }
                    if((opt.value&InputOption.Required)===InputOption.Required) {
                        if((opts[opt.key]=rawArgs[++i])===undefined) {
                            throw new Error(`Value is required for ${arg}`);
                        }
                    }
                } else {
                    args.push(arg);
                }
            }
            // dump(cmd.name,args,opts);
            await cmd.execute(args, opts);
        }
    }
    
    async showHelp(scriptName) {
        let {name,version} = this;
        const commands = await Promise.all(this.commands);
        sortBy(commands,'name');
        
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
        
        let exe;
        if(await access(require.main.filename, consts.X_OK)) {
            // TODO: check if script is in PATH already, or if its in the current directory or up
            exe = Path.relative(process.cwd(),require.main.filename);
        } else {
            exe = process.argv0+' '+Path.relative(process.cwd(),scriptName);
        }
        
        console.log(`  ${Chalk.green(exe)} <command> [arguments] [options]`);
        console.log();
        console.log(Chalk.yellow('Available commands:'));
        
        
        const maxLength = Math.max(...commands.map(cmd => cmd.name.length));
        for(let cmd of commands) {
            console.log(`  ${Chalk.green(cmd.name.padEnd(maxLength))}  ${cmd.description}`);
        }
    }
}

function sortBy(array, prop) {
    return array.sort((a, b) => a[prop].localeCompare(b[prop]));
}