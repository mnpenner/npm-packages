const crypto = require('crypto');
const [now, hrt] = [Date.now(), process.hrtime.bigint()]; // generate these as close to the same time as possible
const start = BigInt(now) * 1000000n - hrt;

/**
 * Generates a 16-byte UUID. The first 8 bytes represent the time it was created.
 *
 * @return {Buffer}
 */
function ouid() {
    const time = start + process.hrtime.bigint();
    let buf = Buffer.allocUnsafe(16);
    buf.writeUInt32BE(Number(time >> 32n), 0);
    buf.writeUInt32BE(Number(time & 4294967295n), 4);
    crypto.randomFillSync(buf, 8, 8);
    return buf;
}

module.exports = ouid;

for(;;) {
    process.stdout.write(`\r${ouid().toString('hex')}`);
}