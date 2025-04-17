


function byteLen(str: string) {
    return new TextEncoder().encode(str).length
}

let found: string[] = [];

for(let i=0; i<256; ++i) {
    const ch = String.fromCodePoint(i)
    if(byteLen(JSON.stringify(ch)) === 3) {
        found.push(ch)
    } else {
        // console.log(JSON.stringify(ch))
    }
}

const alphabet = found.join('')
console.log(alphabet.length)
console.log(JSON.stringify(alphabet))

// 94 chars
const FOUND = " !#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~"


// blurhash uses base 83? https://github.com/woltapp/blurhash?tab=readme-ov-file#why-base-83
// https://github.com/woltapp/blurhash/blob/712a47f946b98c30097eb1ada086ea00b18681ec/TypeScript/src/base83.ts (looks inefficient!)
