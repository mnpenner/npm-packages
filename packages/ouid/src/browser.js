import BigInt from './bigint.js';

function hrtime() {
    let pnow = performance.now();
    let pnow_s = Math.trunc(pnow/1000);
    let pnow_ms = pnow % 1000;
    let pnow_ns = Math.trunc(pnow_ms * 1e6);
    return [pnow_s, pnow_ns];
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
