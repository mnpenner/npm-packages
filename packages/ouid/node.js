const Crypto = require('crypto');


function init() {
    let [now,hrt] = [Date.now(), process.hrtime()]; // generate these as close to the same time as possible
    let ms = now%1000;
    let s = (now-ms)/1000;
    let ns = ms*1000;
    return [s-hrt[0],ns-hrt[1]];
}

let start = init();

// console.log(start);

// function hrms() {
//     let [s,ns] = process.hrtime();
//     return s*1e3 + ns/1e6;
// }
//
// let start = Date.now() - hrms();
//
// let counter = 0;
// let lastTime = null;
//
// /**
//  * Generates a 16-byte UUID. The first 6 bytes represent the time it was created.
//  *
//  * @return {Buffer}
//  */
function uuid() {
    let hrt = process.hrtime();
    let now = [start[0]+hrt[0], start[1]+hrt[1]];
    
    return now;
    
    
    // return start+hrms();
    //
    // let newTime = start+hrms();
    // console.log(newTime);
    //
    // if(newTime !== lastTime) {
    //     counter = 0;
    //     lastTime = newTime;
    // } else {
    //     counter = (counter + 1) % 10;
    // }
    // let now = newTime * 10 + counter;
    // let buf = Buffer.allocUnsafe(16);
    //
    // buf.writeUIntBE(now, 0, 6, true);
    // Crypto.randomBytes(10).copy(buf, 6);
    // return buf;
}
//
//
//
// console.log(s,ns);

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
    uuid(),
    uuid(),
]);

// console.log([
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
//     process.hrtime(),
// ]);