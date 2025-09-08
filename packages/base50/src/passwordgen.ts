import {NumberEncoder} from './number-encoder'
import {BASE62, BASE64URL, PASSWORD} from './alphabets'
import {randomBytes} from 'crypto'
import {ChunkedBufferEncoder} from './chunked-buffer-encoder'

const pwEncoder = new NumberEncoder(BASE62);
// const pwEncoder2 = new ChunkedBufferEncoder(BASE62,4,5);
const b64Encoder = new NumberEncoder(BASE62);

console.log(pwEncoder.maxLength(32))

for(let i = 0; i < 16; i++) {
    const buf = randomBytes(32)
    console.log('N',pwEncoder.encodeBuf(buf))
    // console.log('C',pwEncoder2.encode(buf))
}


function logBase(x: number, base: number): number {
    return Math.log(x) / Math.log(base)
}

function charsNeeded(bits: number, base: number): number {
    return Math.ceil(bits * Math.log2(2) / Math.log2(base))
}


for(let i = 16; i <= PASSWORD.length; i++) {
    console.log(`Base ${i}`,charsNeeded(256,i))
}
