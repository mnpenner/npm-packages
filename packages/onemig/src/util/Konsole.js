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

    clear() {
        if(this.len) {
            process.stdout.write('\r' + ''.padEnd(this.len, ' ') + '\r');
            this.len = null;
        }
    }
}