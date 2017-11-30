import BigInt from './bigint.js';
import getTime from './time';

/**
 * Generates a 16-byte UUID. The first 8 bytes represent the time it was created.
 *
 * @return {ArrayBuffer}
 */
export default function uuid() {
    const [sec,ns] = getTime();

    let num = BigInt(sec + String(ns).padStart(9,'0'));

    let {quotient,remainder} = num.divmod(4294967296);

    let buf = new ArrayBuffer(16);
    let dataView = new DataView(buf,0,8);
    dataView.setUint32(0, quotient.valueOf(), false);
    dataView.setUint32(4, remainder.valueOf(), false);

    let cryptView = new Uint8Array(buf, 8, 8);
    crypto.getRandomValues(cryptView);
    
    return buf;
}
