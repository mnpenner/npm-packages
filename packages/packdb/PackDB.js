const FS = require('fs');

const createDeepProxy = require('./deepProxy');
const debounce = require('lodash/debounce');
const inspect = o => require('util').inspect(o, {colors: true, showHidden: true, depth: 5});
const Chalk = require('chalk');

const DATA = Symbol('data');
const OPT = Symbol('options');
const WRITE = Symbol('writeFn');
const PATH = Symbol('filePath');

class PackDB {
    constructor(path, options) {
        this[OPT] = Object.assign({},
            options,
            {
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            });

        let obj = Object.create(null);

        try {
            let buf = FS.readFileSync(path);
            if(buf.length > 0) {
                obj = this[OPT].deserialize(buf);
            }
        } catch(err) {
            if(err.code !== 'ENOENT') {
                throw err;
            }
        }

        this[PATH] = path;
        this[DATA] = createDeepProxy(obj, {
            set(target, path, value, receiver) {
                console.log(Chalk.green('set'), path.join('.'), Chalk.dim('='), inspect(value));
            },

            deleteProperty(target, path) {
                console.log(Chalk.red('delete'), path.join('.'));
            }
        });
        
        this.write = debounce(this[WRITE].bind(this), 10, {
            maxWait: 5000,
        });
    }

    get data() {
        return this[DATA];
    }

    [WRITE]() {
        return new Promise((resolve, reject) => {
            let buf = this[OPT].serialize(this[DATA]);
            FS.writeFile(this[PATH], buf, err => {
                if(err) return reject(err);
                resolve();
            });
        });
    }

    writeNow() {
        this.write.cancel();
        return this[WRITE]();
    }
}


module.exports = PackDB;