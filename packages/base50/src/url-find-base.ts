


function byteLen(str: string) {
    return new TextEncoder().encode(str).length
}

let found: string[] = [];

for(let i=0; i<256; ++i) {
    const ch = String.fromCodePoint(i)
    if(byteLen(encodeURIComponent(ch)) === 1) {
        found.push(ch)
    } else {
        // console.log(JSON.stringify(ch))
    }
}

const alphabet = found.join('')
console.log(alphabet.length)
console.log(JSON.stringify(alphabet))
