import {parse} from 'path-to-regexp'
import jsSerialize from 'js-serialize'

// console.dir(parse(`/hello/:foo/bar/:baz/*splat/xxx{/:optional}`),{depth:null})


function compile(
    pattern: string,
    {delimiter = '/', encode = 'encodeURIComponent'}: { delimiter?: string; encode?: string } = {}
): string {
    const {tokens} = parse(pattern)

    type Prop = { name: string; type: string }

    const baseProps: Prop[] = []     // required, non-group props
    const groupTypes: string[] = []  // each: "{...} | {...?: never}"

    const typeOfParam = (t: any) =>
        t.type === 'wildcard' ? 'Iterable<string|number>' : 'string|number'

    const makeProp = (name: string, t: any): Prop => ({name, type: typeOfParam(t)})

    // gather ALL props under a group (including nested groups)
    function collectGroupProps(ts: any[]): Prop[] {
        const props: Prop[] = []
        for(const t of ts) {
            if(t.type === 'param' || t.type === 'wildcard') props.push(makeProp(t.name, t))
            else if(t.type === 'group') props.push(...collectGroupProps(t.tokens))
        }
        return props
    }

    // collect base required props, and build per-group union types
    function collectTypes(ts: any[], intoBase = true) {
        for(const t of ts) {
            if((t.type === 'param' || t.type === 'wildcard') && intoBase) {
                baseProps.push(makeProp(t.name, t))
            } else if(t.type === 'group') {
                const groupProps = collectGroupProps(t.tokens)
                if(groupProps.length) {
                    const some = '{' + groupProps.map(p => `${jsSerialize(p.name)}: ${p.type}`).join(',') + '}'
                    const none = '{' + groupProps.map(p => `${jsSerialize(p.name)}?: never`).join(',') + '}'
                    groupTypes.push(`${some}|${none}`)
                }
                // also recurse to find nested groups' own unions
                collectTypes(t.tokens, false)
            }
        }
    }

    collectTypes(tokens)

    // build the `params` type: {base} & (({g1}|{g1?:never}) & ({g2}|{g2?:never}) & ...)
    let paramsType = '{' + baseProps.map(p => `${jsSerialize(p.name)}: ${p.type}`).join(',') + '}'
    if(groupTypes.length) paramsType += ' & (' + groupTypes.map(g => `(${g})`).join(' & ') + ')'

    // --- runtime codegen ---
    let ts = `function generate(params:${paramsType}):string {\n`
    ts += 'let sb=""\n'

    const delim = jsSerialize(delimiter)

    function collectNames(ts2: any[]): string[] {
        const out: string[] = []
        for(const t of ts2) {
            if(t.type === 'param' || t.type === 'wildcard') out.push(t.name)
            else if(t.type === 'group') out.push(...collectNames(t.tokens))
        }
        return out
    }

    function appendStr(ts2: any[], optional = false) {
        if(!optional) {
            for(const t of ts2) {
                if(t.type === 'param' || t.type === 'wildcard') {
                    ts += `if(params[${jsSerialize(t.name)}]==null) throw new Error(${jsSerialize('Missing param: ' + t.name)})\n`
                }
            }
        }

        for(const t of ts2) {
            if(t.type === 'text') {
                ts += 'sb+=' + jsSerialize(t.value) + '\n'
            } else if(t.type === 'param') {
                ts += `sb+=${encode}(params[${jsSerialize(t.name)}])\n`
            } else if(t.type === 'wildcard') {
                ts += `sb+=Array.from(params[${jsSerialize(t.name)}],${encode}).join(${delim})\n`
            } else if(t.type === 'group') {
                const names = collectNames(t.tokens).map(jsSerialize)
                if(!names.length) continue
                const all = names.map(n => `params[${n}]!=null`).join(' && ')
                const none = names.map(n => `params[${n}]==null`).join(' && ')
                const list = names.join(', ')
                ts += `if(${all}){\n`
                appendStr(t.tokens, true)
                ts += `} else if(!(${none})){\n`
                ts += `throw new Error(${jsSerialize(`Group requires all-or-none: ${list}`)})\n`
                ts += `}\n`
            }
        }
    }

    appendStr(tokens)

    ts += 'return sb\n'
    ts += '}\n'

    return ts
}


console.log(compile(`/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}`, {delimiter: ','}))

function generate(params: { "foo": string | number, "baz": string | number, "splat": Iterable<string | number> } & (({
    "optional": string | number,
    "two": string | number
} | { "optional"?: never, "two"?: never }))): string {
    let sb = ""
    if(params["foo"] == null) throw new Error("Missing param: foo")
    if(params["baz"] == null) throw new Error("Missing param: baz")
    if(params["splat"] == null) throw new Error("Missing param: splat")
    sb += "/hello/"
    sb += encodeURIComponent(params["foo"])
    sb += "/bar/"
    sb += encodeURIComponent(params["baz"])
    sb += "/"
    sb += Array.from(params["splat"], encodeURIComponent).join(",")
    sb += "/xxx"
    if(params["optional"] != null && params["two"] != null) {
        sb += "/"
        sb += encodeURIComponent(params["optional"])
        sb += "/lol/"
        sb += encodeURIComponent(params["two"])
    } else if(!(params["optional"] == null && params["two"] == null)) {
        throw new Error("Group requires all-or-none: \"optional\", \"two\"")
    }
    return sb
}

console.log(generate({foo: 'bar', baz: 2, splat: new Set(['a', 'b', 3]), optional: 'd', two: 'sox'}))
)
