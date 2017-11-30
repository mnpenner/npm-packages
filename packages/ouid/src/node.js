import Crypto from 'crypto';
import BigInt from './bigint';
import getTime from './time';

/**
 * Generates a 16-byte UUID. The first 8 bytes represent the time it was created.
 *
 * @return {Buffer}
 */
export default function uuid() {
    const [sec,ns] = getTime();

    let num = BigInt(sec + String(ns).padStart(9,'0'));
    
    let {quotient,remainder} = num.divmod(4294967296);

    let buf = Buffer.allocUnsafe(16);
    buf.writeUInt32BE(quotient.valueOf(),0,true);
    buf.writeUInt32BE(remainder.valueOf(),4,true);
    Crypto.randomBytes(8).copy(buf, 8);
    
    return buf;
}

