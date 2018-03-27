function hrtimeToMs(hrtimePair) {
    return hrtimePair[0] * 1e3 + hrtimePair[1] / 1e6;
}

export function startTimer() {
    return process.hrtime();
}

export function stopTimer(hrtimeStart) {
    return hrtimeToMs(process.hrtime(hrtimeStart));
}