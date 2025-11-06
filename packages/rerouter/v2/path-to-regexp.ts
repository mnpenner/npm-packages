import {parse} from 'path-to-regexp'
import jsSerialize from 'js-serialize'

// console.dir(parse(`/hello/:foo/bar/:baz/*splat/xxx{/:optional}`),{depth:null})


function compile(
    pattern: string,
    {delimiter = '/', encode = 'encodeURIComponent'}: { delimiter?: string; encode?: string } = {}
): string {
    const {tokens} = parse(pattern)
    console.dir(tokens, {depth: null})

    const params: string[] = []

    function findParams(tokens: any[], optional = false) {
        for(const t of tokens) {
            if(t.type === 'param') {
                params.push(jsSerialize(t.name) + (optional ? '?' : '') + ': string|number')
            } else if(t.type === 'wildcard') {
                params.push(jsSerialize(t.name) + (optional ? '?' : '') + ': (string|number)[]')
            } else if(t.type === 'group') {
                findParams(t.tokens, true)
            }
        }
    }

    findParams(tokens)

    let ts = 'function generate(params:{' + params.join(',') + '}):string {\n'

    ts += 'let sb=""\n'

    const delim = jsSerialize(delimiter)

    function appendStr(tokens: any[], optional = false) {
        if(!optional) {
            for(const t of tokens) {
                if(t.type === 'param' || t.type === 'wildcard') {
                    ts += `if(params[${jsSerialize(t.name)}]==null) throw new Error(${jsSerialize('Missing param: ' + t.name)})\n`
                }
            }
        } else {
            let conditions = []
            for(const t of tokens) {
                if(t.type === 'param' || t.type === 'wildcard') {
                    conditions.push(`params[${jsSerialize(t.name)}]!=null`)
                }
            }
            ts += `if(${conditions.join(' && ')}) {\n`
        }

        for(const t of tokens) {
            if(t.type === 'text') {
                ts += 'sb+=' + jsSerialize(t.value) + '\n'
            } else if(t.type === 'param') {
                ts += `sb+=${encode}(params[${jsSerialize(t.name)}])\n`
            } else if(t.type === 'wildcard') {
                ts += `sb+=Array.from(params[${jsSerialize(t.name)}],${encode}).join(${delim})\n`
            } else if(t.type === 'group') {
                appendStr(t.tokens, true)
            }
        }

        if(optional) {
            ts += '}\n'
        }
    }

    appendStr(tokens)

    ts += 'return sb\n'
    ts += '}\n'

    // const params = []
    //
    // for(const t of tokens) {
    //     if(t.type === 'param') {
    //         params.push(jsSerialize(t.name)+':string|number')
    //     } else if(t.type === 'group') {
    //         for(const o of t.tokens) {
    //
    //         }
    //     }
    // }

    return ts
}


console.log(compile(`/hello/:foo/bar/:baz/*splat/xxx{/:optional/lol/:two}`))

function generate(params:{"foo": string|number,"baz": string|number,"splat": (string|number)[],"optional"?: string|number,"two"?: string|number}):string {
    let sb=""
    if(params["foo"]==null) throw new Error("Missing param: foo")
    if(params["baz"]==null) throw new Error("Missing param: baz")
    if(params["splat"]==null) throw new Error("Missing param: splat")
    sb+="/hello/"
    sb+=encodeURIComponent(params["foo"])
    sb+="/bar/"
    sb+=encodeURIComponent(params["baz"])
    sb+="/"
    sb+=Array.from(params["splat"],encodeURIComponent).join("/")
    sb+="/xxx"
    if(params["optional"]!=null && params["two"]!=null) {
        sb+="/"
        sb+=encodeURIComponent(params["optional"])
        sb+="/lol/"
        sb+=encodeURIComponent(params["two"])
    }
    return sb
}


console.log(generate({foo: 'bar', baz: 'qux', splat: ['a', 'b', 'c'], optional: 'd',two:'bup'}))
