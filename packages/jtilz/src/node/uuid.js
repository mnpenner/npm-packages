import Crypto from 'crypto';

let counter = 0;
let lastTime = null;

/**
 * Generates a 16-byte UUID. The first 6 bytes represent the time it was created.
 *
 * @return {Buffer}
 */
export default function uuid() {
    let newTime = Date.now();
    
    if(newTime !== lastTime) {
        counter = 0;
        lastTime = newTime;
    } else {
        counter = (counter + 1) % 10;
    }
    let now = newTime * 10 + counter;
    let buf = Buffer.allocUnsafe(16);

    buf.writeUIntBE(now, 0, 6, true);
    Crypto.randomBytes(10).copy(buf, 6);
    return buf;
}

