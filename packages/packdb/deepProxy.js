function createDeepProxy(target, handler) {
    function makeHandler(path) {
        return {
            set(target, key, value, receiver) {
                if(typeof value === 'object') {
                    value = makeProxy(value, [...path, key]);
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
        }
    }
    
    function makeProxy(obj, path) {
        for(let key of Object.keys(obj)) {
            if(typeof obj[key] === 'object') {
                obj[key] = makeProxy(obj[key], [...path, key]);
            }
        }
        return new Proxy(obj, makeHandler(path))
    }
    
    return makeProxy(target, []);
}


module.exports = createDeepProxy;

