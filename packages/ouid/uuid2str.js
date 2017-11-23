import generateUuid from './uuid';


const alpha = '0123456789abcdefghjkmnpqrstvwxyz';

function uuid2str(uuid) {
    if(!Buffer.isBuffer(uuid)) {
        throw new Error(`Input must be a Buffer`);
    }
    if(uuid.length !== 16) {
        throw new Error(`Buffer should have exactly 16 bytes; got ${uuid.length}`);
    }
    let int1 = uuid.readUInt32BE(0, true);
    let int2 = uuid.readUInt32BE(4, true);
    let int3 = uuid.readUInt32BE(8, true);
    let int4 = uuid.readUInt32BE(12, true);

    // the 3 bits immediately after the time bits
    let checkbits = (int2 >> 13) & 0b111;

    let nums = [
        // time
        (int1 >> 27) & 0b11111,
        (int1 >> 22) & 0b11111,
        (int1 >> 17) & 0b11111,
        (int1 >> 12) & 0b11111,
        (int1 >> 7) & 0b11111,
        (int1 >> 2) & 0b11111,
        ((int1 & 0b11) << 3) | ((int2 >> 29) & 0b111),
        (int2 >> 24) & 0b11111,
        (int2 >> 19) & 0b11111,
        ((int2 >> 14) & 0b11100) | ((int2 >> 11) & 0b11),

        (int2 >> 6) & 0b11111,
        (int2 >> 1) & 0b11111,
        ((int2 & 0b1) << 4) | ((int3 >> 28) & 0b1111),
        (int3 >> 23) & 0b11111,
        (int3 >> 18) & 0b11111,
        (int3 >> 13) & 0b11111,
        (int3 >> 8) & 0b11111,
        (int3 >> 3) & 0b11111,

        ((int3 & 0b111) << 2) | ((int4 >> 30) & 0b11),
        (int4 >> 25) & 0b11111,
        (int4 >> 20) & 0b11111,
        (int4 >> 15) & 0b11111,
        (int4 >> 10) & 0b11111,
        (int4 >> 5) & 0b11111,
        int4 & 0b11111,
    ];

    // console.log(nums);
    return nums.map(x => alpha[x]).join('');
}


for(let i = 0; i < 10; ++i) {
    const uuid = generateUuid();
    console.log(uuid, uuid2str(uuid));
}