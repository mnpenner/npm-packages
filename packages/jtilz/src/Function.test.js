import {wrapMethods} from './Function';


test('wrapMethods', () => {
    const secret = Symbol();
    
    const module = {
        foo: function bar() {
        },
        baz: 'quux',
        corge: 9,
        waldo: () => secret,
    };


    function wrap(fn) {
        fn[secret] = true;
        return fn;
    }

    const wrapped = wrapMethods(module, wrap);

    expect(wrapped.foo[secret]).toBe(true);
    expect(wrapped.waldo()).toBe(secret);
    expect(wrapped).not.toHaveProperty('baz');
    expect(wrapped).not.toHaveProperty('corge');
});