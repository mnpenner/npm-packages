const Jtilz = require('../dist/node');
let start = process.hrtime();

setTimeout(() => {
    console.log(Jtilz.hrtimeElapsed(start));
}, 100);

// console.log(Object.keys(Jtilz).join('\n'));