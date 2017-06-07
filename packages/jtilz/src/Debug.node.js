import Util from 'util';

// TODO: should we export this...? as what?
function format(...args) {
    if(args.length === 1 && Object.prototype.toString.call(args[0]) === '[object String]') {
        return args[0];
    }
    return args.map(o => Util.inspect(o, {colors: true, depth: 10, showHidden: false})).join(' ');
}

export function log(...args) {
    return console.log(format(...args));
}