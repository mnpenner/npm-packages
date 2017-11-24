const Crypto = require('crypto');
const getTime = require('./getTime');
const BigInt = require('./bigint');

function padNano(ns) {
    let padLen = 9 - ns.length;
    if(padLen > 0) {
        return '000000000'.slice(0,padLen) + ns;
    }
    return String(ns);
}

// /**
//  * Generates a 16-byte UUID. The first 6 bytes represent the time it was created.
//  *
//  * @return {Buffer}
//  */
function uuid() {
    const [sec,ns] = getTime(); 
    console.log(sec,ns);

    let int = BigInt(sec + padNano(ns));
    
    let {quotient,remainder} = int.divmod(4294967296);

    let buf = Buffer.allocUnsafe(16);
    buf.writeUInt32BE(quotient.valueOf(),0,true);
    buf.writeUInt32BE(remainder.valueOf(),4,true);
    Crypto.randomBytes(8).copy(buf, 8);
    
    return buf;
}


console.log(uuid());


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

module.exports = uuid;