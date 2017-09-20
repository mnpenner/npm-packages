const jsSerialize = require('../');

it('serializes strings', () => {
    expect(jsSerialize('foo')).toBe('"foo"');
    expect(jsSerialize(new String('bar'))).toBe('"bar"');
});

it('serializes numbers', () => {
    expect(jsSerialize(1)).toBe('1');
    expect(jsSerialize(3.14)).toBe('3.14');
    expect(jsSerialize(Math.PI)).toBe('Math.PI');
    expect(jsSerialize(0)).toBe('0');
    expect(jsSerialize(-0)).toBe('-0');
    expect(jsSerialize(new Number(2))).toBe('2');
});

it('serializes Infinity', () => {
    expect(jsSerialize(Infinity)).toBe('Infinity');
    expect(jsSerialize(-Infinity)).toBe('-Infinity');

    expect(jsSerialize(Infinity, {compact:true})).toBe('1/0');
    expect(jsSerialize(-Infinity, {compact:true})).toBe('1/-0');
});

it('serializes NaN', () => {
    expect(jsSerialize(NaN)).toBe('NaN');
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

it('serializes maps', () => {
    expect(jsSerialize(new Map([["a",1],["b",2]]))).toBe('new Map([["a",1],["b",2]])');
    expect(jsSerialize(new Map([]))).toBe('new Map');
});

it('serializes dates', () => {
    expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'))).toBe('new Date("2017-05-04T16:55:50.457Z")');
    expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'), {compact: true})).toBe('new Date(1493916950457)');
});

it('serializes scripts', () => {
    expect(jsSerialize('<script>alert("injection")</script>')).toBe('"<script>alert(\\"injection\\")<\\/script>"');
    expect(jsSerialize(() => document.write('</script >'))).toBe('() => document.write(\'<\\/script >\')');
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

    expect(jsSerialize({[Symbol.for('foo')]:'foo'})).toBe(`{[Symbol.for("foo")]:"foo"}`);
});

it('serializes well-known symbols', () => {
    const wellKnownSymbols = ["hasInstance", "isConcatSpreadable", "iterator", "match", "replace", "search", "species", "split", "toPrimitive", "toStringTag", "unscopables"];
    for(let wks of wellKnownSymbols) {
        expect(jsSerialize(Symbol[wks])).toBe(`Symbol.${wks}`);    
    }
});

it('quotes keyword property names', () => {
    expect(jsSerialize({class:1,do:2,finally:3,for:4,five:5})).toBe(`{"class":1,"do":2,"finally":3,"for":4,five:5}`);
    expect(jsSerialize({class:1,do:2,finally:3,for:4,five:5},{safe:false})).toBe(`{class:1,do:2,finally:3,for:4,five:5}`);
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

    expect(jsSerialize(true,{compact:true})).toBe('!0');
    expect(jsSerialize(false,{compact:true})).toBe('!1');
});

it('serializes toSource', () => {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource#Overriding_the_toSource()_method

    function Person(name) {
        this.name = name;
    }

    Person.prototype.toSource = function Person_toSource() {
        return `new Person(${JSON.stringify(this.name)})`;
    };
    
    let joe = new Person('Joe');
    
    expect(jsSerialize(joe)).toBe(`new Person("Joe")`);
});

it('serializes toJSON', () => {
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior

    var obj = {
        foo: 'foo',
        toJSON: function() {
            return 'bar';
        }
    };

    expect(jsSerialize(obj)).toBe('"bar"');
    expect(jsSerialize({ x: obj })).toBe('{x:"bar"}');
});

it('passes options recursively', () => {
    expect(jsSerialize({foo:{bar:true}},{compact:true})).toBe('{foo:{bar:!0}}');
});

it('serializes recursive objects', () => {
    let foo = {foo:1};
    expect(jsSerialize({a:foo,b:foo})).toBe("(($0)=>({a:$0={foo:1},b:$0}))()");
    
    let o = {a:'perfect'};
    o.circle = o;
    expect(jsSerialize(o)).toBe('not-sure-yet');
});