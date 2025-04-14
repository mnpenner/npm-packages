function log2(num: number): number {
    return Math.log2(num)
}

function roundDown(num: number): number {
    return Math.floor(num / 8) * 8
}

function sortByKey<T>(arr: T[], key: keyof T, ascending = true): T[] {
    return arr.sort((a, b) => {
        const aVal = a[key]
        const bVal = b[key]

        if (aVal === bVal) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1

        return ascending
            ? (aVal > bVal ? 1 : -1)
            : (aVal < bVal ? 1 : -1)
    })
}

function findOptimal(alphaSize: number): Record<string,number> {


    let bytes = 0
    // let i = 1
    let minWasted = Infinity
    let best
    for(let i=1;i<=32;++i) {
        const maxVal = alphaSize ** i
        const bits = log2(maxVal)
        const rounded = roundDown(bits)
         bytes = rounded / 8
        if(bytes >= 8) break
        const wasted =  bits-rounded
        // console.log(alphaSize, i, bits, rounded, bytes, wasted)

        let ret = {
            base: alphaSize,
            chars: i,
            maxVal,
            bytes,
            wasted,
        }

        if(wasted === 0) {
            return ret
        }

        if(wasted < minWasted) {
            minWasted = wasted
            best = ret
        }

        // ++i
    }

    return best!
}



async function main(argv: string[]): Promise<number | void> {
    const formatter = Intl.NumberFormat(undefined,{maximumFractionDigits: 2})

    let results = []

    for(let i = 2; i <= 256; ++i) {
        results.push(findOptimal(i))
        // console.log(i, findOptimal(i))
    }

    sortByKey(results, 'wasted')

    for(const [i,r] of results.entries()) {
        console.log(`${String(i+1).padStart(3,' ')}. Base ${String(r.base).padEnd(3,' ')} : ${r.bytes} bytes <-> ${r.chars} chars; MaxVal=${formatter.format(r.maxVal)}, WastedBits=${formatter.format(r.wasted)}`)
    }
}


if(import.meta.main) {
    main(process.argv.slice(2))
        .then(exitCode => {
            process.exitCode = exitCode!
        }, err => {
            console.error(err || "an unknown error occurred")
            process.exitCode = 1
        })
}
