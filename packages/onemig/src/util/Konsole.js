import Util from 'util';

export default class Konsole {

    rewrite(str) {
        const padded = this.len ? '\r' + str.padEnd(this.len, ' ') : str;
        process.stdout.write(padded);
        this.len = str.length; // might need 'width' if we use fancypants characters
    }

    writeLn(str) {
        if(this.len) {
            str = '\r' + str.padEnd(this.len, ' ');
        }
        process.stdout.write(str + '\n');
        this.len = null;
    }
    
    writeDebug(...args) {
        this.clear();
        process.stdout.write(args.map(o => Util.inspect(o, {colors: true, depth: 10, showHidden: false, maxArrayLength: 10})).join(' ')+'\n');
    }

    clear() {
        if(this.len) {
            process.stdout.write('\r' + ''.padEnd(this.len, ' ') + '\r');
            this.len = null;
        }
    }
}