const util = require('util');

export function format(...args) {
    if(args.length === 1 && Object.prototype.toString.call(args[0]) === '[object String]') {
        return args[0];
    }
    return args.map(o => util.inspect(o, {colors: true, depth: 10, showHidden: false})).join(' ');
}

export function log(...args) {
    return console.log(format(...args));
}