const jsSerialize = require('../');

it('serializes strings', () => {
    expect(jsSerialize('foo')).toBe('"foo"');
    expect(jsSerialize(new String('bar'))).toBe('"bar"');
});

it('serializes numbers', () => {
    expect(jsSerialize(1)).toBe('1');
    expect(jsSerialize(new Number(2))).toBe('2');
});

it('serializes regexes', () => {
    expect(jsSerialize(/foo/i)).toBe('/foo/i');
    expect(jsSerialize(new RegExp('bar', 'myu'))).toBe('/bar/muy');
    expect(jsSerialize(/foo\nbar/)).toBe('/foo\\nbar/');
});

it('serializes sets', () => {
    expect(jsSerialize(new Set([3,1,2]))).toBe('new Set([3,1,2])');
    expect(jsSerialize(new Set([]))).toBe('new Set');
});


it('serializes arrays', () => {
    expect(jsSerialize([])).toBe('[]');
    expect(jsSerialize([3,1,2])).toBe('[3,1,2]');
    expect(jsSerialize(new Array(4))).toBe('new Array(4)');
    expect(jsSerialize([undefined,undefined,undefined,undefined])).toBe('[undefined,undefined,undefined,undefined]');
    let a = new Array(4);
    a[1] = 4;
    expect(jsSerialize(a)).toBe('[,4,,,]');
});


it('serializes symbols', () => {
    expect(jsSerialize(Symbol.for('foo'))).toBe('Symbol.for("foo")');
    expect(jsSerialize(Symbol())).toBe('Symbol()');
    expect(jsSerialize(Symbol('bar'))).toBe('Symbol("bar")');
});

it('serializes null', () => {
    expect(jsSerialize(null)).toBe('null');
});

it('serializes undefined', () => {
    expect(jsSerialize(undefined)).toBe('undefined');
});

it('serializes native functions', () => {
    expect(jsSerialize(isNaN)).toBe('isNaN');
    expect(jsSerialize(Math.sin)).toBe('Math.sin');
});