let perfTime;

// alternatively, use `process.browser`: https://nolanlawson.com/2017/01/09/how-to-write-a-javascript-package-for-both-node-and-the-browser/ 
if(typeof process === 'object' && typeof process.hrtime === 'function') {
    perfTime = process.hrtime;
} else {
    perfTime = () => {
        let now = performance.now();
        let sec = Math.trunc(now/1000);
        let ms = now % 1000;
        let ns = Math.trunc(ms * 1e6);
        return [sec, ns];
    }
}

function init() {
    let [now, hrt] = [Date.now(), perfTime()]; // generate these as close to the same time as possible
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

const START = init();

export default function getTime() {
    let hrt = perfTime();
    let time = [START[0] + hrt[0], START[1] + hrt[1]];

    if(time[1] >= 1e9) {
        ++time[0];
        time[1] -= 1e9;
    }

    return time;
}