import {NumberEncoder} from './number-encoder'
import {BASE64URL, PASSWORD} from './alphabets'
import {randomBytes, randomInt} from 'crypto'

const pwEncoder = new NumberEncoder(PASSWORD);
const b64Encoder = new NumberEncoder(BASE64URL);

console.log(pwEncoder.maxLength(32))

for(let i = 0; i < 16; i++) {
    console.log(pwEncoder.bufToStr(randomBytes(32)))
}


function logBase(x: number, base: number): number {
    return Math.log(x) / Math.log(base)
}

function charsNeededFor2Pow256(x: number, base: number): number {
    return Math.ceil(x * Math.log2(2) / Math.log2(base))
}


for(let i = 16; i <= 256; i++) {
    console.log(i,charsNeededFor2Pow256(256,i))
}
