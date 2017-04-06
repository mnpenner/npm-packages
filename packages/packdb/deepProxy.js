function createDeepProxy(target, handler) {
    function recurse(obj, path) {
        return new Proxy(obj, {
            set(target, key, value, receiver) {
                if(typeof value === 'object') {
                    for(let k of Object.keys(value)) {
                        if(typeof value[k] === 'object') {
                            value[k] = recurse(value[k], [...path, key, k]);
                        }
                    }
                    value = recurse(value, [...path, key]);
                }
                target[key] = value;
                if(handler.set) {
                    handler.set(target, [...path, key], value, receiver);
                }
                return true;
            },

            deleteProperty(target, key) {
                if(Reflect.has(target, key)) {
                    let deleted = Reflect.deleteProperty(target, key);
                    if(deleted) {
                        if(handler.deleteProperty) {
                            handler.deleteProperty(target, [...path, key]);
                        }
                    }
                    return deleted;
                }
                return false;
            }
        });
    }

    return recurse(target, []);
}


module.exports = createDeepProxy;

