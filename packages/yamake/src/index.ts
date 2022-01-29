import * as yaml from 'js-yaml'
import * as fs from 'fs/promises'
import * as childProc from 'child_process'
import * as Path from 'path'
import {constants as fsconst} from 'fs'
import Chalk from 'chalk'
import {hrtime} from 'process'
import * as crypto from 'crypto'
import {EOL} from 'os'
import type {WriteStream} from 'node:tty'
import {SpawnOptionsWithoutStdio} from 'child_process'
import rimraf from 'rmfr'
import mkdirp from 'mkdirp'

function objectHash(obj: any): string {
    return crypto.createHash('md5').update(jsonStringify(obj)).digest('base64url')
}

function toStringArray(arg: any): string[] {
    if(arg == null) return []
    if(!Array.isArray(arg)) {
        return [String(arg)]
    }
    return arg.map(x => String(x))
}

function escapeShellArg(s: string) {
    if (!/^[A-Za-z0-9=._\/-]+$/.test(s)) {
        s = "'" + s.replace(/'/g, "'\\''") + "'";
        // s = s.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
        //     .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    return s;
}

async function mtime(file: string): Promise<bigint|null> {
    try {
        const stat = await fs.stat(file, {bigint: true})
        return stat.mtimeNs
    } catch(err: any) {
        if(err.code === 'ENOENT') {
            return null;
        }
        throw err;
    }
    // console.log(stat)

}

function max<T>(args: Array<T>): T {
    if(!args.length) throw new Error("Missing args")
    let m = args[0]
    for(let i=1; i<args.length; ++i) {
        if(args[i] > m) {
            m = args[i]
        }
    }
    return m
}

function min<T>(args: Array<T>): T {
    if(!args.length) throw new Error("Missing args")
    let m = args[0]
    for(let i=1; i<args.length; ++i) {
        if(args[i] < m) {
            m = args[i]
        }
    }
    return m
}

type ValueOf<T> = T[keyof T];


async function access(path: string, mode:ValueOf<typeof fsconst>) {
    try {
        await fs.access(path, mode)
        return true
    } catch(_) {
        return false
    }
}

async function getLastModTime(files: string[]): Promise<bigint|null> {
    const times = await Promise.all(files.map(f =>mtime(f)))
    if(times.includes(null)) {
        return null
    }
    return max(times)
}

function isNotNull<T>(x: T|null): x is T {
    return x != null
}

function doesNotContainNull<T>(arr: Array<T|null>): arr is Array<T> {
    return arr.every(x => x != null)
}

async function getValidMtimesArr(files: string[]): Promise<Array<bigint>> {
    return (await getMtimesArr(files)).filter(isNotNull)
}
async function getMtimesArr(files: string[]): Promise<Array<bigint|null>> {
    if(!files?.length) return []
    return Promise.all(files.map(f =>mtime(f)))
}

async function getMtimes(files: string[]): Promise<Map<string,bigint|null>> {
    return promiseMap(files, mtime);
}

async function promiseMap<TIn, TOut>(inputs: TIn[], fn: (x:TIn)=>Promise<TOut>): Promise<Map<TIn,TOut>> {
    const m = new Map<TIn,TOut>()
    const promises = []
    for(const f of inputs) {
        promises.push(Promise.resolve(fn(f)).then(t => {
            m.set(f,t)
        }))
    }
    await Promise.all(promises)
    return m
}

function filterMap<K,V>(map: Map<K,V>, fn: (v:V,k:K)=>boolean): [K,V][] {
    return Array.from(map).filter(([k,v]) => fn(v,k))
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
    return out
}

async function main(mainArgs: string[]): Promise<number | void> {
    const parsedArgs = parseArgs(mainArgs)
    const interactive = parsedArgs.flags.has('interactive')
    const doc = yaml.load(await fs.readFile(MAKE_FILE, 'utf8')) as any
    let cache: any
    try {
        cache = yaml.load(await fs.readFile(CACHE_FILE, 'utf8')) as any
    } catch(_){}
    cache ??= {}

    const ruleName = parsedArgs.args.length >= 1 ? parsedArgs.args[0] : 'default'

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
        const lastSuccessfulBuildMs: number = cache?.[ruleName]?.lastSuccessfulBuild;
        const lastSuccessfulBuildNanos: bigint = lastSuccessfulBuildMs != null ? msToNs(lastSuccessfulBuildMs) : BigInt(Number.MIN_SAFE_INTEGER)

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
                info(`Creating directory "${fullPath}"`)
                await mkdirp(fullPath)
            }
        }

        let cmd: string = rule.command ?? rule.cmd;
        if(cmd == null) {
            info(`No command`)
            return 0;
        }
        let cmdArgs: string[];
        if(Array.isArray(cmd)) {
            [cmd,...cmdArgs] = cmd
        } else {
            // TODO: https://www.gnu.org/software/make/manual/html_node/Automatic-Variables.html
            // TODO: support $1, $2, ... command-line args
            if(input.length) {
                cmd = cmd.replace(/(?<!\\)\$</g, escapeShellArg(input[0]))
            }
            if(output.length) {
                cmd = cmd.replace(/(?<!\\)\$@/g, output.map(o => escapeShellArg(o)).join(' '))
            }
            cmdArgs = toStringArray(rule.arguments ?? rule.args)
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
        info(Chalk.cyanBright.bold('$ ') + Chalk.green.underline(cmd) + cmdArgs.map(x => ' '+Chalk.underline(x)).join(''))

        const suppressOutput = Boolean(rule.suppressOutput ?? rule.ignoreOutput ?? rule.quiet)


        const start = hrtime.bigint()
        const code = await spawn(ruleName, cmd, cmdArgs, {suppressOutput,interactive,cwd})
        const elapsed = nsToMs(hrtime.bigint() - start)
        info(`Exited with code ${Chalk[code === 0 ? 'green' : 'red'](code)} in ${Chalk.blue(elapsed)}ms`)
        if(code === 0) {
            cache[ruleName] = {
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

function nsToMs(ns: bigint): number {
    return Number(ns/1000n)/1000
}

function msToNs(ms: number): bigint {
    return BigInt(Math.floor(ms))*1000000n
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
}

function spawn(prefix: string, cmd: string, args: string[], opts: SpawnOptions): Promise<number> {
    return new Promise((resolve,reject) => {
        const spawnOpts: SpawnOptionsWithoutStdio = {
            stdio: opts.suppressOutput ? 'ignore' : [opts.interactive ? 'inherit' : 'ignore','pipe','pipe'],
            shell: true,
            cwd: opts.cwd,
        }

        const proc = childProc.spawn(cmd,args,spawnOpts)  // FIXME: I don't think `cmd` is escaped when shell:true
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
