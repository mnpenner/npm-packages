import {getType} from './debug2';

test(getType.name, () => {
    expect(getType(new Set)).toEqual('Set');
    expect(getType([])).toEqual('Array');
    expect(getType({})).toEqual('Object');
    expect(getType('')).toEqual('string');
    expect(getType(new String)).toEqual('String');
    expect(getType(0)).toEqual('number');
    expect(getType(undefined)).toEqual('undefined');
    expect(getType(null)).toEqual('null');
    expect(getType(false)).toEqual('boolean');
    function Bar(){}
    expect(getType(new Bar)).toEqual('Bar');
    expect(getType(Bar)).toEqual('Function');
})