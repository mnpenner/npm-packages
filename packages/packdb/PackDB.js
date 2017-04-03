const FS = require('fs');


const debounce = require('lodash/debounce');

function deepProxy(obj, path = []) {
    return new Proxy(obj, {
        set(target, property, value, receiver) {
            console.log('set', [...path, property].join('.'), '=', value);
            if(typeof value === 'object') {
                for(let k of Object.keys(value)) {
                    if(typeof value[k] === 'object') {
                        value[k] = deepProxy(value[k], [...path, property, k]);
                    }
                }
                value = deepProxy(value, [...path, property]);
            }
            target[property] = value;
            return true;
        },

        deleteProperty(target, property) {
            if(Reflect.has(target, property)) {
                let deleted = Reflect.deleteProperty(target, property);
                if(deleted) {
                    console.log('delete', [...path, property].join('.'));
                }
                return deleted;
            }
            return false;
        }
    });
}

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
        
        try{
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
        this[DATA] = deepProxy(obj);

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