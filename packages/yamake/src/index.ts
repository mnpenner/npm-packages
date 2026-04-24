#!/usr/bin/env node
import * as yaml from 'js-yaml'
import * as fs from 'fs/promises'
import * as childProc from 'child_process'
import {SpawnOptionsWithoutStdio} from 'child_process'
import * as Path from 'path'
import Chalk from 'chalk'
import {hrtime} from 'process'
import {EOL} from 'os'
import type {WriteStream} from 'node:tty'
import rimraf from 'rmfr'
import mkdirp from 'mkdirp'
import {
    camel2kebab,
    doesNotContainNull,
    escapeShellArg,
    filterMap,
    getValidMtimesArr,
    max,
    min,
    msToNs,
    mtime,
    nsToMs,
    objectHash,
    promiseMap,
    toStringArray
} from './util'
import {resolveExe} from './winpath'
import assert from 'assert'
// import crossSpawn from 'cross-spawn'

const isWindows = process.platform === 'win32'

// https://github.com/moxystudio/node-cross-spawn/issues/150
// https://stackoverflow.com/questions/37459717/error-spawn-enoent-on-windows/37487465
async function crossSpawn(cmd: string, args: string[], opts: Omit<childProc.SpawnOptions,'shell'|'windowsVerbatimArguments'>) {
    if(isWindows) {
        cmd = await resolveExe(cmd)  // TODO: factor in opts.env.PATH

    //     return childProc.spawn(`"${cmd}"`,args, {
    //         ...opts,
    //         shell: true,
    //         windowsVerbatimArguments: false,
    //     })
    //
    //     // const cmdString = 'cmd.exe /D /S /C ' + [cmd,...args].map(a => escapeWindowsArg(a)).join(' ')
    //     // console.log('CMD:',cmdString)
    //     // return childProc.spawn(cmdString, {
    //     //     ...opts,
    //     //     shell: false,
    //     //     windowsVerbatimArguments: true,
    //     // })
    //     // https://github.com/moxystudio/node-cross-spawn/blob/5d843849e1ed434b7030e0aa49281c2bf4ad2e71/lib/parse.js#L57
    //     return childProc.spawn(process.env.ComSpec || 'cmd.exe',['/d','/s','/c',escapeWindowsArg(cmd),...args.map(a => escapeWindowsArg(a))], {
    //         ...opts,
    //         shell: false,
    //         windowsVerbatimArguments: true,
    //     })
    }
    return childProc.spawn(cmd, args, opts)
}




const MAKE_FILE = './yamake.yml'
const CACHE_FILE = './.ymcache.yml'

const TIME_FORMATTER = Intl.DateTimeFormat(['en-CA'],{
    // timeZone: 'America/Los_Angeles',
    timeStyle: 'medium',
    dateStyle: 'short',
})

function formatTime(d: bigint|null) {
    if(d == null) return '(null)'
    return TIME_FORMATTER.format(nsToMs(d))
}

interface ParsedArgs {
    args: string[]
    flags: Set<string>
    opts: Record<string,string>
}

const SHORT_FLAGS = {
    i: 'interactive'
}

function parseArgs(args: string[]) {
    let endOfArgs = false
    const out: ParsedArgs = {
        args: [],
        flags: new Set,
        opts: {},
    }
    for(const arg of args) {
        if(!endOfArgs && arg === '--') {
            endOfArgs = true
        } else if(!endOfArgs && arg.startsWith('-')) {
            if(arg.startsWith('--')) {
                out.flags.add(arg.slice(2))
            } else {
                out.flags.add(SHORT_FLAGS[arg.slice(1)])
            }
        } else {
            out.args.push(arg)
        }
    }
    // TODO: parse opts
    // TODO: parse flags for forwarding to rule
    return out
}

async function main(mainArgs: string[]): Promise<number | void> {
    const parsedArgs = parseArgs(mainArgs)
    let interactive: null|boolean = null;
    if(parsedArgs.flags.has('interactive')) {
        interactive = true;
    } else if(parsedArgs.flags.has('non-interactive')) {
        interactive = false;
    }
    // const interactive = parsedArgs.flags.has('interactive')
    const doc = yaml.load(await fs.readFile(MAKE_FILE, 'utf8')) as any
    let cache: any
    try {
        cache = yaml.load(await fs.readFile(CACHE_FILE, 'utf8')) as any
    } catch(_){}
    cache ??= {}

    const ruleName = parsedArgs.args.length >= 1 ? parsedArgs.args[0] : 'default'

    // TODO: auto-install node_modules based on which lockfile/tools are installed; add option to disable
    // TODO: support rule shorthand `default: build`

    async function resolveRule(ruleName: string, depth:number=0): Promise<number> {
        // '  '.repeat(depth)+
        const info = (...data: any[]) => console.info(Chalk.gray(`｢${ruleName}｣`),...data)  // TODO: color each rule differently?
        const rule = doc.rules?.[ruleName]
        if(!rule) {
            console.error(`Rule "${ruleName}" not found`)
            return 1
        }

        const input = toStringArray(rule.inputs ?? rule.input)
        const auxInput = toStringArray(rule.auxInputs ?? rule.auxInput)
        const output = toStringArray(rule.outputs ?? rule.output)
        const deps = toStringArray(rule.dependencies ?? rule.deps);
        const odeps = toStringArray(rule.orderedDependencies ?? rule.odeps ?? rule.prerequisites ?? rule.prereqs);
        // TODO: find implicit dependencies from input<->output
        const cwd = rule.cwd ?? rule.workingDir ?? rule.workingDirectory ?? process.cwd();
        const emptyDir = toStringArray(rule.emptyDir)
        const makeDir = toStringArray(rule.mkdir ?? rule.mkdirp ?? rule.makeDir ?? rule.makeDirectory)  // TODO: allow `true` to create any directories for output files

        if(odeps.length) {
            for(const dep of odeps) {
                const exitCode = await resolveRule(dep,depth+1)
                if(exitCode !== 0) {
                    info(`Ordered dependency "${dep}" failed with exit code ${exitCode}`)
                    return exitCode
                }
            }
        }
        if(deps.length) {
            const exitCodes = await promiseMap(deps, d => resolveRule(d,depth+1));  // TODO: flatten deps into parallelizable tree
            const failedDeps = filterMap(exitCodes, v => v !== 0)
            if(failedDeps.length) {
                info(`${failedDeps.length} dependencies failed; aborting`, Object.fromEntries(failedDeps))
                return failedDeps[0][1]
            }
            // const exitCodes = await Promise.all(deps.map(d => resolveRule(d)))
            // const someFail = exitCodes.find(c => c !== 0)
            // if(someFail != null) {
            //     console.info(`[${ruleName}] Failed to build dependency; aborting`)
            //     return someFail
            // }
        }

        const startTime = Date.now()
        const inputTimes = await Promise.all(input.map(f =>mtime(f)))
        if(inputTimes.includes(null)) {
            info(`Missing input file`)
            return 2
        }
        const outputTimes = await Promise.all(output.map(f =>mtime(f)))
        const lastSuccessfulBuildMs: number = cache?.rules?.[ruleName]?.lastSuccessfulBuild;
        const lastSuccessfulBuildNanos: bigint = lastSuccessfulBuildMs != null ? msToNs(lastSuccessfulBuildMs) : BigInt(Number.MIN_SAFE_INTEGER)

        // TODO: factor in ruleHash for cache-busting. e.g. if the `cmd` is changed but the input/files aren't, it should still rebuild (and maybe output why)

        if(doesNotContainNull(outputTimes)) {
            // FIXME: should dependencies run if nothing's modified? how goes GNU Make do it?
            const auxInputTimes = await getValidMtimesArr(auxInput)
            const allInputTimes = [...inputTimes,...auxInputTimes]
            const inputLastMod = allInputTimes.length ? max(allInputTimes) : null
            if(inputLastMod) {
                const allOutputTimes = outputTimes.filter(t => t >= lastSuccessfulBuildNanos)
                const oldestOutputModTime = allOutputTimes.length ? min(allOutputTimes)! : lastSuccessfulBuildNanos
                if(oldestOutputModTime > inputLastMod) {
                    info(`Inputs not modified`)  // TODO: instead print "dist/oldest.js is newer than src/newest.ts"
                    return 0
                }
            }
        }
        // TODO: check if the input files are the outputs of any other rules and automatically run those build rules too
        // --> what if a file appears in the output of 2 or more different rules...? what does make do?

        if(emptyDir.length) {
            // FIXME: should this happen *before* evaluating the dependencies?
            for(const dir of emptyDir) {
                const fullPath = Path.resolve(cwd,dir)
                info(`Emptying directory "${fullPath}"`)
                await rimraf(fullPath)
                await mkdirp(fullPath)
            }
        }

        if(makeDir.length) {
            for(const dir of makeDir) {
                const fullPath = Path.resolve(cwd,dir)
                info(`Creating directory "${fullPath}"`)  // TODO: only print if it doesn't exist
                await mkdirp(fullPath)
            }
        }

        let nodeScript: string = rule.nodeScript ?? rule.node ?? rule.jsBin ?? rule.jsbin;
        let cmd: string;
        let cmdArgs: string[]
        let shell = rule.shell;
        // info('shell is',shell)
        const ruleCmd = rule.command ?? rule.cmd
        const ruleArgs = rule.arguments ?? rule.args

        if(rule.interactive && interactive === false) {
            info(`Interactive rule cannot run in non-interactive mode`)
            return 6;
        }

        if(nodeScript) {
            cmd = process.execPath;
            // TODO: node options
            cmdArgs = []
            if(rule.nodeOptions) {
                for(const [k,v] of Object.entries(rule.nodeOptions)) {
                    const flag = '--'+camel2kebab(k)
                    if(v===true) {
                        cmdArgs.push(flag)
                    } else if(v === false) {
                        cmdArgs.push(flag+'=false')
                    } else if(Array.isArray(v)) {
                        for(const x of v) {
                            cmdArgs.push(flag+'='+x)
                        }
                    } else {
                        cmdArgs.push(flag+'='+v)
                    }
                }
            }
            cmdArgs.push('--', ...toStringArray(nodeScript))
        } else {
            cmd = ruleCmd;
            if(cmd == null) {
                info(`No command`)
                return 0;
            }
            if(Array.isArray(cmd)) {
                if(ruleArgs) {
                    info("Don't use args when setting cmd as an array")
                    return 5;
                }
                [cmd, ...cmdArgs] = cmd
                if(shell == null) {
                    shell = false;
                }
            } else if(ruleArgs) {
                if(!Array.isArray(ruleArgs)) {
                    info("Args must be an array")
                    return 3;
                }
                cmdArgs = ruleArgs
                if(shell == null) {
                    shell = false;
                }
            } else {
                // TODO: https://www.gnu.org/software/make/manual/html_node/Automatic-Variables.html
                // TODO: support $1, $2, ... command-line args


                assert(!ruleArgs?.length)

                cmdArgs = [];
                if(shell == null) {
                    shell = true;
                }
                if(shell) {
                    if(input.length) {
                        cmd = cmd.replace(/(?<!\\)\$<(?![$@%<>?^+|*&!])/g, escapeShellArg(input[0]))
                    }
                    if(output.length) {
                        cmd = cmd.replace(/(?<!\\)\$@(?![$@%<>?^+|*&!])/g, output.map(o => escapeShellArg(o)).join(' '))
                    }
                }
            }
        }

        if(shell && cmdArgs?.length) {
            info("Cannot enable shell and have arguments")
            return 4;
        }


        // const binDir = Path.join(process.cwd(),'node_modules','.bin')
        // const nmPath = Path.join(binDir,cmd)
        // const executable = await access(nmPath, fsconst.R_OK)
        // // console.log(process.argv0, process.argv[0])
        // if(executable) {
        //     cmdArgs.unshift(nmPath)
        //     // cmd = process.argv0
        //     cmd = 'node.exe'
        // }
        // const {Path: envPath, ...env} = process.env
        // env.PATH = binDir+';'+envPath
        // console.log(env)
        // console.log('$ ' + [cmd,...cmdArgs].map(shellescapeArg).join(' '))

        if(shell) {
            const whatShell = shell === true ? (isWindows ? process.env.ComSpec : '/bin/sh') : shell;
            info(Chalk.redBright.bold(whatShell + '$ ') + Chalk.white(cmd))
            // info(Chalk.cyanBright.bold('$ ') + Chalk.green.underline(whatShell) + ['-c',cmd].map(x => ' ' + Chalk.underline(x)).join(''))
        } else {
            info(Chalk.cyanBright.bold('$ ') + Chalk.green.underline(cmd) + cmdArgs.map(x => ' ' + Chalk.underline(x)).join(''))
        }

        const suppressOutput = Boolean(rule.suppressOutput ?? rule.ignoreOutput ?? rule.quiet)

        const start = hrtime.bigint()
        const code = await spawn(ruleName, cmd, cmdArgs, {suppressOutput,interactive:Boolean(rule.interactive != null ? rule.interactive : interactive),cwd,shell})
        const elapsed = nsToMs(hrtime.bigint() - start)
        info(`Exited with code ${Chalk[code === 0 ? 'green' : 'red'](code)} in ${Chalk.blue(elapsed)}ms`)
        if(code === 0) {
            cache.rules ??= {}
            cache.rules[ruleName] = {
                lastSuccessfulBuild: startTime,
                buildDuration: elapsed,
                ruleHash: objectHash(rule),
            }
        }
        return code
    }


    const ret = await resolveRule(ruleName)
    await fs.writeFile(CACHE_FILE, yaml.dump(cache))
    return ret
}

function jsonReplacer(this:any,key:string,value:any):any {
    if(value instanceof Set) {
        return Array.from(value)
    }
    if(value instanceof Map) {
        return Object.fromEntries(value.entries())
    }
    return value
}

export function jsonStringify(obj: any,space?:string|number): string {
    return JSON.stringify(obj, jsonReplacer, space)
}


function varDump(x: any) {
    if(x === undefined) return '(undefined)'
    return jsonStringify(x,2)
}

function logJson(...args: any[]) {
    console.log(args.map(a => varDump(a)).join("\n---\n"))
}



function pipe2console(prefix: string, stream: WriteStream) {
    return function(data: Buffer) {
        const str = data.toString('utf8').replace(/(\r?\n|\n)$/,'')
        if(!str) return
        const lines = str.split(/\r?\n|\n/g)
        for(const line of lines) {
            stream.write(Chalk.gray(`[${prefix}]`)+' '+line+EOL)
        }
    }
}

interface SpawnOptions {
    suppressOutput?: boolean
    interactive?: boolean
    cwd?: string
    shell?: boolean|string
}

async function spawn(prefix: string, cmd: string, args: string[], opts: SpawnOptions): Promise<number> {
    return new Promise(async (resolve,reject) => {
        const spawnOpts: SpawnOptionsWithoutStdio = {
            stdio: opts.suppressOutput ? 'ignore' : [opts.interactive ? 'inherit' : 'ignore','pipe','pipe'],
            shell: opts.shell,
            cwd: opts.cwd,
            // windowsVerbatimArguments: false,
        }


        // TODO: wnpx ts-node --transpile-only src/index.ts --interactive versioni
        console.log('process.stdin.isTTY',process.stdin.isTTY)
        console.log({cmd,args,spawnOpts})

        const proc = await crossSpawn(cmd,args,spawnOpts)  // FIXME: I don't think `cmd` is escaped when shell:true
        // TODO: implement stdoutFile to pipe to file instead
        if(!opts.suppressOutput) {
            proc.stdout!.on('data', pipe2console(prefix, process.stdout))
            proc.stderr!.on('data', pipe2console(prefix, process.stderr))
        }
        proc.on('error', err => {
            reject(err)
        })
        proc.on('close', exitCode => {
            resolve(exitCode ?? 0)
        })
    })

}

main(process.argv.slice(2))
    .then(exitCode => {
        if(exitCode != null) {
            process.exitCode = exitCode
        }
    }, err => {
        console.error(err)
        process.exitCode = 255
    })
