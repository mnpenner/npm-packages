import {fsa} from '../util/fs';
import dump from '../dump';

// https://github.com/mysql/mysql-server/blob/4f1d7cf5fcb11a3f84cff27e37100d7295e7d5ca/sql/table.cc#L1340
const FRM_VER = 6;
const FRM_VER_TRUE_VARCHAR = FRM_VER+4;

// https://github.com/mysql/mysql-server/blob/4f1d7cf5fcb11a3f84cff27e37100d7295e7d5ca/sql/table.cc#L1360
export async function parseFrm(filename) {
    const fd = await fsa.open(filename,'r');
    try {

        const formInfo = Buffer.allocUnsafe(288);
        await fsa.read(fd, formInfo, 0, formInfo.length, 0)
        const frm_version = formInfo[2]; // 10
        const avg_row_length = formInfo.readInt32LE(34);
        const row_type = formInfo[40];
        const max_rows = formInfo.readInt32LE(18);
        const min_rows = formInfo.readInt32LE(22);
        // const key_info_length = formInfo.readInt16LE(28);
        const key_info_length = formInfo.readInt16LE(0x001c);
        dump(key_info_length);
        dump(formInfo.slice(0x003e+key_info_length,0x003e+key_info_length+100).length);
        const keyInfo = Buffer.alloc(key_info_length);
        await fsa.read(fd, keyInfo, 0, key_info_length, 0x003e+2);
        dump(keyInfo.toString('hex'));
        // const key_info_length = formInfo.slice(28,30);
        // let keys, key_parts;
        // if(key_info_length[0] & 0x80) {
        //     keys = (key_info_length[1] << 7) | (key_info_length[0] & 0x7f)
        //     key_parts = formInfo.readInt16LE(30);
        // } else {
        //     keys = key_info_length[0];
        //     key_parts = key_info_length[1];
        // }
        // dump({keys,key_parts});
        // dump(frm_version);
        // dump(formInfo[33])

    } finally {
        await fsa.close(fd);
    }
}