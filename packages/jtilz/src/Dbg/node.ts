import Util = require('util');
import {isString} from '../Lang/is';

// TODO: should we export this...? as what?
function format(...args: any[]) {
    if(args.length === 1 && isString(args[0])) {
        return args[0];
    }
    return args.map(o => Util.inspect(o, {colors: true, depth: 10, showHidden: false})).join(' ');
}

export function log(...args: any[]) {
    return console.log(format(...args));
}