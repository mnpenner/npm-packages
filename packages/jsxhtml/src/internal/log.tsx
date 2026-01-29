import util from 'util'


function formatVar(obj: any) {
    if(typeof obj === 'string') return obj
    return util.inspect(obj, {
        depth: 3,
        maxArrayLength: 3,
        maxStringLength: 300,
        breakLength: 120,
        colors: true,
        compact: true,
    })
}

export function devLog(...vars: any[]) {
    console.log(vars.map(formatVar).join('  '))
}

export function logFull(...vars: any[]) {
    console.log(vars.map(v => util.inspect(v, {showHidden: false, depth: null, colors: true})).join('  '))
}
