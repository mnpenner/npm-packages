const Crypto = require('crypto');
const BigInt = require('./bigint');

function padNano(ns) {
    let padLen = 9 - ns.length;
    if(padLen > 0) {
        return '000000000'.slice(0,padLen) + ns;
    }
    return String(ns);
}

function init() {
    let [now, hrt] = [Date.now(), process.hrtime()]; // generate these as close to the same time as possible
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

const start = init();

function getTime() {
    let hrt = process.hrtime();
    let now = [start[0] + hrt[0], start[1] + hrt[1]];

    if(now[1] >= 1e9) {
        ++now[0];
        now[1] -= 1e9;
    }

    return now;
}


/**
 * Generates a 16-byte UUID. The first 8 bytes represent the time it was created.
 *
 * @return {Buffer}
 */
function uuid() {
    const [sec,ns] = getTime(); 

    let num = BigInt(sec + padNano(ns));
    
    let {quotient,remainder} = num.divmod(4294967296);

    let buf = Buffer.allocUnsafe(16);
    buf.writeUInt32BE(quotient.valueOf(),0,true);
    buf.writeUInt32BE(remainder.valueOf(),4,true);
    Crypto.randomBytes(8).copy(buf, 8);
    
    return buf;
}



module.exports = uuid;