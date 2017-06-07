import {decToHex} from './Number';

test(decToHex.name, () => {
    expect(decToHex(0)).toEqual('0');
    expect(decToHex(1)).toEqual('1');
    expect(decToHex(2)).toEqual('2');
    expect(decToHex(15)).toEqual('f');
    expect(decToHex(16)).toEqual('10');
    expect(decToHex(0x7fffffff)).toEqual('7fffffff');
    expect(decToHex(0x80000000)).toEqual('80000000');
    expect(decToHex(0xFFFFFFFF)).toEqual('ffffffff');
    expect(decToHex(0x100000000)).toEqual('100000000');
    expect(decToHex(0x1fffffffffffff)).toEqual('1fffffffffffff');
})