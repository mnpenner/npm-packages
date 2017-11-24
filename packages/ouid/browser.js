import BigInt from './bigint.js';

function padNano(ns) {
    let padLen = 9 - ns.length;
    if(padLen > 0) {
        return '000000000'.slice(0,padLen) + ns;
    }
    return String(ns);
}

function init() {
    let [now, hrt] = [Date.now(), hrtime()]; // generate these as close to the same time as possible
    let now_ms = now % 1000;
    let now_s = (now - now_ms) / 1000;
    let now_ns = now_ms * 1e6;
    let ret = [now_s - hrt[0], now_ns - hrt[1]];
    if(ret[1] < 0) {
        --ret[0];
        ret[1] += 1e9;
    }
    return ret;
}
function hrtime() {
    let pnow = performance.now();
    let pnow_s = Math.trunc(pnow/1000);
    let pnow_ms = pnow % 1000;
    let pnow_ns = Math.trunc(pnow_ms * 1e6);
    return [pnow_s, pnow_ns];
}

const start = init();

function getTime() {
    let hrt = hrtime();
    let now = [start[0] + hrt[0], start[1] + hrt[1]];

    if(now[1] >= 1e9) {
        ++now[0];
        now[1] -= 1e9;
    }

    return now;
}

function randomBytes(howMany) {
    let buf = new Uint8Array(howMany);
    crypto.getRandomValues(buf);
    return buf;
}

export default function uuid() {
    const [sec,ns] = getTime();

    let num = BigInt(sec + padNano(ns));

    let {quotient,remainder} = num.divmod(4294967296);

    let buf = new ArrayBuffer(16);
    let dataView = new DataView(buf,0,8);
    dataView.setUint32(0, quotient.valueOf(), false);
    dataView.setUint32(4, remainder.valueOf(), false);

    let cryptView = new Uint8Array(buf, 8, 8);
    crypto.getRandomValues(cryptView);
    
    return buf;
}

//
// function padNano(ns) {
//     let padLen = 9 - ns.length;
//     if(padLen > 0) {
//         return '000000000'.slice(0,padLen) + ns;
//     }
//     return String(ns);
// }
//
// function init() {
//     let [now, hrt] = [Date.now(), process.hrtime()]; // generate these as close to the same time as possible
//     let now_ms = now % 1000;
//     let now_s = (now - now_ms) / 1000;
//     let now_ns = now_ms * 1e6;
//     let ret = [now_s - hrt[0], now_ns - hrt[1]];
//     if(ret[1] < 0) {
//         --ret[0];
//         ret[1] += 1e9;
//     }
//     return ret;
// }
//
// const start = init();
//
// function getTime() {
//     let hrt = process.hrtime();
//     let now = [start[0] + hrt[0], start[1] + hrt[1]];
//
//     if(now[1] >= 1e9) {
//         ++now[0];
//         now[1] -= 1e9;
//     }
//
//     return now;
// }
//
//
// // /**
// //  * Generates a 16-byte UUID. The first 6 bytes represent the time it was created.
// //  *
// //  * @return {Buffer}
// //  */
// function uuid() {
//     const [sec,ns] = getTime();
//     console.log(sec,ns);
//
//     let int = BigInt(sec + padNano(ns));
//
//     let {quotient,remainder} = int.divmod(4294967296);
//
//     let buf = Buffer.allocUnsafe(16);
//     buf.writeUInt32BE(quotient.valueOf(),0,true);
//     buf.writeUInt32BE(remainder.valueOf(),4,true);
//     Crypto.randomBytes(8).copy(buf, 8);
//
//     return buf;
// }
//
//
//
// module.exports = uuid;