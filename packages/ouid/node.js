const Crypto = require('crypto');
const getTime = require('./getTime');
const BigInt = require('./bigint');

function padNano(ns) {
    let pad = 9 - ns.length;
    if(pad) {
        return '000000000'.slice(0,pad) + ns;
    }
    return String(ns);
}

// /**
//  * Generates a 16-byte UUID. The first 6 bytes represent the time it was created.
//  *
//  * @return {Buffer}
//  */
function uuid() {
    const [sec,ns] = getTime(); // getTime
    
    let int = BigInt(sec + padNano(ns));
    
    let {quotient,remainder} = int.divmod(4294967296);

    let buf = Buffer.allocUnsafe(16);
    buf.writeUInt32BE(quotient.valueOf(),0,true);
    buf.writeUInt32BE(remainder.valueOf(),4,true);
    Crypto.randomBytes(8).copy(buf, 8);
    
    return buf;
   
    
    
    // not sure how to combine these two numbers without bringing in a big-int library
    // we could split it into 2 32-bit uints though. this buys us 136 years though instead of 584 -- quite a loss!
    
    // return buf;


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


// console.log(uuid());


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

// for(;;) {
//     uuid();
// }

// for(;;) {
//
//     let hrt = process.hrtime();
//     let ns = hrt[1];
//     console.log(ns);
//     // if(ns < 204745397) break;
// }

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