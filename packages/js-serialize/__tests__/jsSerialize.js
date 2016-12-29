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