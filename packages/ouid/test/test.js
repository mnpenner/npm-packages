const uuid = require('../dist/main');

console.log(uuid);

console.log([
    uuid(),
    uuid(),
    uuid(),
    uuid(),
    uuid(),
    uuid(),
    uuid(),
    uuid(),
    uuid(),
]);

let time = process.hrtime();
uuid();
let elapsed = process.hrtime(time);
console.log(elapsed[0]*1e9 + elapsed[1]);

function hrtimeToMs(hrtimePair) {
    return hrtimePair[0] * 1e3 + hrtimePair[1] / 1e6;
}