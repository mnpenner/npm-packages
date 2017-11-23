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

function now() {
    let hrt = process.hrtime();
    let now = [start[0] + hrt[0], start[1] + hrt[1]];

    if(now[1] >= 1e9) {
        ++now[0];
        now[1] -= 1e9;
    }

    return now;
}

module.exports = now;