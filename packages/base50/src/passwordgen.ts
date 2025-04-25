import {NumberEncoder} from './number-encoder'
import {BASE64URL, PASSWORD} from './alphabets'
import {randomBytes} from 'crypto'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'

const pwEncoder = new NumberEncoder(PASSWORD);
const pwEncoder2 = new ChunkedBufferEncoder(PASSWORD,4,5);
const b64Encoder = new NumberEncoder(BASE64URL);

console.log(pwEncoder.maxLength(32))

for(let i = 0; i < 16; i++) {
    const buf = randomBytes(32)
    console.log('N',pwEncoder.encodeBuf(buf))
    console.log('C',pwEncoder2.encode(buf))
}


function logBase(x: number, base: number): number {
    return Math.log(x) / Math.log(base)
}

function charsNeededFor2Pow256(x: number, base: number): number {
    return Math.ceil(x * Math.log2(2) / Math.log2(base))
}


// for(let i = 16; i <= PASSWORD.length; i++) {
//     console.log(i,charsNeededFor2Pow256(256,i))
// }
