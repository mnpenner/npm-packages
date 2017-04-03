const FS = require('fs');

const fd = Symbol();
const d = Symbol();


function deepProxy(obj) {
    return new Proxy(obj, {
        set(target, property, value, receiver) {
            console.log('set', property,'=', value);
            if(typeof value === 'object') {
                for(let k of Object.keys(value)) {
                    if(typeof value[k] === 'object') {
                        value[k] = deepProxy(value[k]);
                    }
                }
                value = deepProxy(value);
            }
            target[property] = value;
            return true;
        },
        deleteProperty(target, property) {
            if(Reflect.has(target, property)) {
                let deleted = Reflect.deleteProperty(target, property);
                if(deleted) {
                    console.log('delete', property);
                }
                return deleted;
            }
            return false;
        }
    });
}


class PackDB {
    constructor(path, options) {
        options = Object.assign({},
            options,
            {
                serialize: JSON.stringify,
                deserialize: JSON.parse,
            });

        let obj = Object.create(null);
        try {
            const stat = FS.statSync(path);
            this[fd] = FS.openSync(path, 'a+');
            if(stat.size > 0) {
                let buf = new Buffer(stat.size);
                let bytesRead = FS.readSync(this[fd], buf, 0, stat.size, 0);
                obj = options.deserialize(buf);
            }
        } catch(_) {
            this[fd] = FS.openSync(path, 'wx');
        }
        this[d] = deepProxy(obj);
    }

    get data() {
        return this[d];
    }
}


module.exports = PackDB;