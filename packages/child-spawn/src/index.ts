import {exec} from 'node:child_process'

type Var = string | number | Var[]

function escapeString(obj: string) {
    return "$'"+ Array.from(obj).map(ch => {
        const cp = ch.codePointAt(0)!
        switch(cp) {
            // https://www.gnu.org/software/bash/manual/html_node/ANSI_002dC-Quoting.html
            case 0x07: return '\\a'
            case 0x08: return '\\b'
            case 0x0C: return '\\f'
            case 0x0A: return '\\n'
            case 0x0D: return '\\r'
            case 0x09: return '\\t'
            case 0x0B: return '\\v'
            // case 0x22: return '\\"'
            case 0x27: return "\\'"
            case 0x33: return "\\e"
            case 0x5C: return '\\\\'
        }
        if(cp >= 32 && cp <= 126) {
            return ch
        }
        if(cp <= 0xFF) {
            return '\\x' + cp.toString(16).padStart(2, '0')
        }
        if(cp <= 0xFFFF) {
            return '\\u' + cp.toString(16).padStart(4, '0')
        }
        return '\\U' + cp.toString(16).padStart(8,'0')
    }).join('') + "'"
}

function escapeVar(str: Var): string {
    if(Array.isArray(str)) {
        return str.map(s => escapeVar(s)).join(' ')
    }
    if(typeof str === 'number') {
        return str.toLocaleString('en-US', {useGrouping: false, maximumFractionDigits: 20})
    }
    if(/^[0-9a-zA-Z_./]+$/.test(str)) {
        return str
    }
    return escapeString(str)
}

function escapeTemplate([cmd, ...args]: TemplateStringsArray, vars: Var[]) {
    const out = [cmd]
    for(let i = 0; i < vars.length; ++i) {
        out.push(escapeVar(vars[i]), args[i])
    }
    return out.join('')
}


export function nl(strings: TemplateStringsArray, ...vars: Var[]) {
    const cmd = escapeTemplate(strings, vars)

    console.log(cmd)
}


const foo = nl`echo ${"baz"} bux ${["\x07","\u{12345}",5,"quo'te","wha\nt"]} yeye`

console.log(foo)
