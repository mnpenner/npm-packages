import * as yaml from 'js-yaml'
import * as fs from 'fs/promises'
import * as childProc from 'child_process'
import * as Path from 'path'
import {constants as fsconst} from 'fs'
import Chalk from 'chalk'
import { hrtime } from 'process';

function toStringArray(arg: any): string[] {
    if(arg == null) return []
    if(!Array.isArray(arg)) {
        return [String(arg)]
    }
    return arg.map(x => String(x))
}

function shellescapeArg(s: string) {
    if (!/^[A-Za-z0-9=._\/-]+$/.test(s)) {
        s = "'" + s.replace(/'/g, "'\\''") + "'";
        s = s.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
            .replace(/\\'''/g, "\\'"); // remove non-escaped single-quote if there are enclosed between 2 escaped
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

async function getMtimes(files: string[]): Promise<Map<string,bigint|null>> {
    const m = new Map<string,bigint|null>()
    const promises = []
    for(const f of files) {
        promises.push(mtime(f).then(t => {
            m.set(f,t)
        }))
    }
    await Promise.all(promises)
    return m
}

async function main(mainArgs: string[]): Promise<number | void> {
    const doc = yaml.load(await fs.readFile('./yamake.yml', 'utf8')) as any
    const ruleName = mainArgs.length >= 1 ? mainArgs[0] : 'default'
    const rule = doc.rules?.[ruleName]
    if(!rule) {
        console.error(`Rule "${ruleName}" not found`)
        return 1
    }
    const input = toStringArray(rule.inputs ?? rule.input)
    const auxInput = toStringArray(rule.auxInputs ?? rule.auxInput)
    const output = toStringArray(rule.outputs ?? rule.output)

    const inputTimes = await Promise.all(input.map(f =>mtime(f)))
    if(inputTimes.includes(null)) {
        console.info(`Missing input file`)
        return 2
    }
    const outputTimes = await Promise.all(output.map(f =>mtime(f)))
    if(!outputTimes.includes(null)) {
        const auxInputTimes = auxInput.length ? (await Promise.all(auxInput.map(f =>mtime(f)))).filter(t => t !== null) : []
        const inputLastMod = max([...inputTimes,...auxInputTimes])!
        const outputLastMod = max(outputTimes)!
        if(outputLastMod > inputLastMod) {
            console.info(`Inputs not modified`)
            return 0
        }
    }
    // TODO: check if the input files are the outputs of any other rules and automatically run those build rules too
    // --> what if a file appears in the output of 2 or more different rules...? what does make do?
    const deps = toStringArray(rule.dependencies ?? rule.deps);
    let cmd = rule.command ?? rule.cmd;
    const cmdArgs = toStringArray(rule.arguments ?? rule.args)
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
    console.log(Chalk.cyanBright.bold('$ ') + Chalk.green(shellescapeArg(cmd)) + cmdArgs.map(x => ' '+Chalk.underline(x)).join(''))

    const start = hrtime.bigint()
    const code = await spawn(ruleName, cmd, cmdArgs)
    const elapsed = toMs(hrtime.bigint() - start)
    console.log(`${Chalk.bold.whiteBright(ruleName)} exited with code ${Chalk.green(code)} in ${Chalk.blue(elapsed)}ms`)
}

function toMs(ns: bigint): number {
    return Number(ns/1000n)/1000
}

function spawn(prefix: string, cmd: string, args: string[]): Promise<number> {
    return new Promise((resolve,reject) => {
        const proc = childProc.spawn(cmd,args,{stdio: ['ignore','pipe','pipe'],shell:true})
        proc.stdout.on('data', (data:Buffer) => {
            const lines = data.toString('utf8').trimEnd().split(/\r?\n|\n/g)
            for(const line of lines) {
                console.log(Chalk.gray(`[${prefix}]`)+' '+line)
            }
        })
        proc.stderr.on('data', (data:Buffer) => {
            const lines = data.toString('utf8').trimEnd().split(/\r?\n|\n/g)
            for(const line of lines) {
                console.error(Chalk.gray(`[${prefix}]`)+' '+line)
            }
            // console.log(`[${ruleName}]E`,String(data))
        })
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
