import * as yaml from 'js-yaml'
import * as fs from 'fs/promises'
import * as childProc from 'child_process'
import * as Path from 'path'
import {constants as fsconst} from 'fs'
import Chalk from 'chalk'

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

async function mtime(file: string) {
    const stat = await fs.stat(file, {bigint: true})
    // console.log(stat)
    return stat.mtimeNs
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

async function main(mainArgs: string[]): Promise<number | void> {
    const doc = yaml.load(await fs.readFile('./yamake.yml', 'utf8')) as any
    const ruleName = mainArgs.length >= 1 ? mainArgs[0] : 'default'
    const rule = doc.rules?.[ruleName]
    if(!rule) {
        console.error(`Rule "${ruleName}" not found`)
        return 1
    }
    const input = toStringArray(rule.input)
    const output = toStringArray(rule.output)

    const inputLastMod = max(await Promise.all(input.map(f =>mtime(f))))
    const outputLastMod = max(await Promise.all(output.map(f =>mtime(f))))
    if(outputLastMod > inputLastMod) {
        console.info(`Inputs not modified`)
        // return 0
    }
    let cmd = rule.command ?? rule.cmd;
    const cmdArgs = toStringArray(rule.arguments ?? rule.args)
    const binDir = Path.join(process.cwd(),'node_modules','.bin')
    const nmPath = Path.join(binDir,cmd)
    // const executable = await access(nmPath, fsconst.R_OK)
    // // console.log(process.argv0, process.argv[0])
    // if(executable) {
    //     cmdArgs.unshift(nmPath)
    //     // cmd = process.argv0
    //     cmd = 'node.exe'
    // }
    const {Path: envPath, ...env} = process.env
    env.PATH = binDir+';'+envPath
    // console.log(env)
    // console.log('$ ' + [cmd,...cmdArgs].map(shellescapeArg).join(' '))
    console.log(Chalk.cyanBright.bold('$ ') + Chalk.green(shellescapeArg(cmd)) + cmdArgs.map(x => ' '+Chalk.underline(x)).join(''))
    childProc.spawn(cmd,cmdArgs,{stdio: 'inherit',shell:true})
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
