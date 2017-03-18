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
    expect(jsSerialize(Symbol())).toBe('Symbol()'); // this isn't the same Symbol!
    expect(jsSerialize(Symbol('bar'))).toBe('Symbol("bar")'); // nor is this
});

it('serializes null', () => {
    expect(jsSerialize(null)).toBe('null');
});

it('serializes undefined', () => {
    expect(jsSerialize(undefined)).toBe('undefined');
});

it('serializes native functions', () => {
    expect(jsSerialize(isNaN)).toBe('isNaN');
    expect(jsSerialize(Math.sin)).toBe('Math.sin'); // can be broken with `global.sin = Math.sin`
    expect(jsSerialize(Intl.NumberFormat.supportedLocalesOf)).toBe('Intl.NumberFormat.supportedLocalesOf');
});

it('serializes functions', () => {
    expect(jsSerialize(() => 1)).toBe('() => 1');
    expect(jsSerialize(x => x*2)).toBe('x => x * 2');
    expect(jsSerialize(function(x,y) { return x + y })).toBe("function (x, y) {return x + y;}");
    expect(jsSerialize(function mult(x,y) { return x * y; })).toBe("function mult(x, y) {return x * y;}");
});


it('serializes objects', () => {
    expect(jsSerialize({a:1})).toBe('{a:1}');
    expect(jsSerialize({})).toBe('{}');
    expect(jsSerialize({foo:'bar',baz:9})).toBe('{foo:"bar",baz:9}');
    expect(jsSerialize({'foo bar':'baz',corge:'Waldo'})).toBe('{"foo bar":"baz",corge:"Waldo"}');
    let foo = Symbol.for('Foo');
    expect(jsSerialize({[foo]:'bar'})).toBe(`{[Symbol.for("Foo")]:"bar"}`);
});

it('serializes raw', () => {
    expect(jsSerialize(jsSerialize.raw('foo'))).toBe('foo');
    expect(jsSerialize({context:jsSerialize.raw('__dirname')})).toBe('{context:__dirname}');
});

it('serializes booleans', () => {
    expect(jsSerialize(true)).toBe('true');
    expect(jsSerialize(false)).toBe('false');
});