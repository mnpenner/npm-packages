// import findUp from 'find-up';
import Chalk from 'chalk';
import dump from '../dump';
import Path from 'path';
import {consts,access} from '../util/fs';
import InputOption from './InputOption';
import {toIter} from '../util/array';
import {camelCase} from 'lodash';
import pkgUp from 'pkg-up';

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
            for(let opt of toIter(cmd.options)) {
                if(!opt.name) throw new Error("Option is missing a name");
                if(!opt.key) opt.key = camelCase(opt.name);
                if(opt.default !== undefined) {
                    opts[opt.key] = opt.default;
                } else if(hasFlag(opt.value,InputOption.Array)) {
                    opts[opt.key] = [];
                } else if(hasFlag(opt.value,InputOption.None)) {
                    opts[opt.key] = false;
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
                const handleOpt = opt => {
                    if(!opt) {
                        throw new Error(`Unrecognized option: ${arg}`)
                    }
                    if(hasFlag(opt.value,InputOption.Required|InputOption.Array)) {
                        const val = rawArgs[++i];
                        if(val === undefined) {
                            throw new Error(`Value is required for ${arg}`);
                        }
                        if(hasFlag(opt.value,InputOption.Array)) {
                            if(opts[opt.key] === undefined) {
                                opts[opt.key] = [val];
                            } else {
                                opts[opt.key].push(val);
                            }
                        } else {
                            opts[opt.key] = val;
                        }
                    } else if(hasFlag(opt.value,InputOption.None)) {
                        opts[opt.key] = true;
                    }
                }
                if(arg === '-') {
                    args.push(process.stdin);
                } else if(arg.startsWith('--')) {
                    handleOpt(longOpts.get(arg.slice(2)))
                } else if(arg.startsWith('-')) {
                    handleOpt(shortOpts.get(arg.slice(1)))
                } else {
                    args.push(arg);
                }
            }
            // dump(cmd.name,args,opts);
            const exitCode = await cmd.execute(args, opts);
            
            if(Number.isInteger(exitCode)) {
                process.exit(exitCode);
            }
        }
    }
    
    async showHelp(scriptName) {
        let {name,version} = this;
        const commands = await Promise.all(this.commands);
        sortBy(commands,'name');
        
        if(!name || !version) {
            const pkgJson = await pkgUp(__dirname);
            const pkg = require(pkgJson);
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
        
        let exe = Path.basename(process.argv[1]);
        
        if(exe === 'onemig') {
            // good!
        } else if(await access(require.main.filename, consts.X_OK)) {
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

function hasFlag(val,flag) {
    return (val&flag)!==0;
}

function sortBy(array, prop) {
    return array.sort((a, b) => a[prop].localeCompare(b[prop]));
}