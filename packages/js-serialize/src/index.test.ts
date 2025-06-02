import jsSerialize from '.'
import {expect,describe,it} from 'bun:test'

expect.extend({
    toWse(received: unknown, expected: string) {
        if (typeof received !== 'string') {
            return {
                pass: false,
                message: () => `expected a string but got ${typeof received}`,
            };
        }

        const normalized = received.trim().replace(/\s+/g, ' ');

        const pass = normalized === expected;
        return {
            pass,
            message: () => `expected string ${pass ? 'not':''} to be whitespace-normalized equal to "${expected}" but got "${normalized}"`
        };
    },
});

declare module 'bun:test' {
    interface Matchers<T=unknown> {
        toWse(expected: string): void;
    }
}

describe('strings', () => {
    it('serializes strings', () => {
        expect(jsSerialize('foo')).toEqual('"foo"')
        expect(jsSerialize(new String('bar'))).toEqual('new String("bar")')
    })

    it('encodes unicode using escape sequences', () => {
        expect(jsSerialize('\u303a')).toEqual('"\\u303a"')
        expect(jsSerialize('\u{12345}')).toEqual('"\\u{12345}"')
        expect(jsSerialize('\x1F\x7F')).toEqual('"\\x1f\\x7f"')
        expect(jsSerialize('he"l\\lo')).toEqual('"he\\"l\\\\lo"')
        expect(jsSerialize('0\u12345')).toEqual('"0\\u12345"')
        expect(jsSerialize('\x001')).toEqual('"\\x001"') // \01 would be incorrect!
        expect(jsSerialize('\u{1f469}')).toEqual('"\\u{1f469}"')
    })

    it('uses single-character escape sequences', () => {
        expect(jsSerialize('\b\f\n\r\t\v"\\', {safe: false})).toEqual('"\\b\\f\\n\\r\\t\\v\\"\\\\"')
        expect(jsSerialize('\b\f\n\r\t\v"\\', {safe: true})).toEqual('"\\b\\f\\n\\r\\t\\x0B\\"\\\\"')
    })
})

describe('numbers', () => {
    it('serializes numbers', () => {
        expect(jsSerialize(1)).toEqual('1')
        expect(jsSerialize(3.14)).toEqual('3.14')
        expect(jsSerialize(Math.PI)).toEqual('Math.PI')
        expect(jsSerialize(Number.EPSILON)).toEqual('Number.EPSILON')
        expect(jsSerialize(0)).toEqual('0')
        expect(jsSerialize(new Number(2))).toEqual('new Number(2)')
        expect(jsSerialize(244838016401135, {compact: true})).toEqual('0xdeadcafebeef')
        expect(jsSerialize(244838016401135.1, {compact: true})).toEqual('244838016401135.1')
        expect(jsSerialize(0xFF, {compact: true})).toEqual('255')
    })

    it('serializes negative zero', () => {
        expect(jsSerialize(-0)).toEqual('-0')
    })

    it('serializes Infinity', () => {
        expect(jsSerialize(Infinity)).toEqual('Infinity')
        expect(jsSerialize(-Infinity)).toEqual('-Infinity')

        expect(jsSerialize(Infinity, {compact: true})).toEqual('1/0')
        expect(jsSerialize(-Infinity, {compact: true})).toEqual('1/-0')
    })

    it('serializes NaN', () => {
        expect(jsSerialize(NaN)).toEqual('NaN')
        expect(jsSerialize(Number.NaN)).toEqual('NaN')
        // @ts-ignore
        expect(jsSerialize('wat' - 1)).toEqual('NaN')
    })

    it('serializes BigInts', () => {
        expect(jsSerialize(36893488147419103232n)).toEqual('36893488147419103232n')
        expect(jsSerialize(-1n)).toEqual('-1n')
        expect(jsSerialize(0n)).toEqual('0n')
    })
})

it('serializes regexes', () => {
    expect(jsSerialize(/foo/i)).toEqual('/foo/i')
    expect(jsSerialize(new RegExp('bar', 'myu'))).toEqual('/bar/muy')
    expect(jsSerialize(/foo\nbar/)).toEqual('/foo\\nbar/')
})

it('serializes sets', () => {
    expect(jsSerialize(new Set([3, 1, 2]))).toEqual('new Set([3,1,2])')
    expect(jsSerialize(new Set([]))).toEqual('new Set')
})

it('serializes maps', () => {
    expect(jsSerialize(new Map([["a", 1], ["b", 2]]))).toEqual('new Map([["a",1],["b",2]])')
    expect(jsSerialize(new Map([]))).toEqual('new Map')
})

it('serializes dates', () => {
    // expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'))).toEqual('new Date("2017-05-04T16:55:50.457Z")'); // iOS can't handle ISO dates?!
    expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'), {compact: false})).toEqual('new Date(Date.UTC(2017,4,4,16,55,50,457))')
    expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'), {compact: true})).toEqual('new Date(1493916950457)')
    expect(jsSerialize(new Date(1642572794510), {compact: true})).toEqual('new Date(1642572794510)')
    expect(jsSerialize(new Date(1642572794510), {compact: false})).toEqual('new Date(Date.UTC(2022,0,19,6,13,14,510))')
    expect(jsSerialize(new Date(1642572794000), {compact: false})).toEqual('new Date(Date.UTC(2022,0,19,6,13,14))')
    expect(jsSerialize(new Date(Date.UTC(2022, 0, 19)), {compact: false})).toEqual('new Date(Date.UTC(2022,0,19))')
    expect(jsSerialize(new Date(Date.UTC(2022, 0, 19)), {compact: true})).toEqual('new Date(1642550400000)')
})

it('serializes scripts', () => {
    expect(jsSerialize('<script>alert("injection")</script>')).toEqual('"<script>alert(\\"injection\\")<\\/script>"')
    expect(jsSerialize(() => document.write('</ScRiPt >'))).toEqual('() => document.write("<\\/ScRiPt >")')
})

it('serializes arrays', () => {
    expect(jsSerialize([])).toEqual('[]')
    expect(jsSerialize([3, 1, 2])).toEqual('[3,1,2]')
    expect(jsSerialize(new Array(4))).toEqual('new Array(4)')
    expect(jsSerialize([undefined, undefined, undefined, undefined])).toEqual('[undefined,undefined,undefined,undefined]')
    let a = new Array(4)
    a[1] = 4
    expect(jsSerialize(a)).toEqual('[,4,,,]')
})

describe('symbols', () => {
    it('serializes symbols', () => {
        expect(jsSerialize(Symbol.for('foo'))).toEqual('Symbol.for("foo")')
        expect(jsSerialize(Symbol())).toEqual('Symbol()') // this isn't the same Symbol!
        expect(jsSerialize(Symbol('bar'))).toEqual('Symbol("bar")') // nor is this

        expect(jsSerialize({[Symbol.for('foo')]: 'foo'})).toEqual(`{[Symbol.for("foo")]:"foo"}`)
    })

    it('serializes well-known symbols', () => {
        const wellKnownSymbols = ["hasInstance", "isConcatSpreadable", "iterator", "match", "replace", "search", "species", "split", "toPrimitive", "toStringTag", "unscopables"]
        for(let wks of wellKnownSymbols) {
            expect(jsSerialize(Symbol[wks])).toEqual(`Symbol.${wks}`)
        }
    })
})

it('serializes null', () => {
    expect(jsSerialize(null)).toEqual('null')
})

it('serializes undefined', () => {
    expect(jsSerialize(undefined)).toEqual('undefined')
})

describe('functions', () => {
    it('serializes native functions', () => {
        expect(jsSerialize(isNaN)).toEqual('isNaN')
        expect(jsSerialize(Number.isNaN)).toEqual('Number.isNaN')
        expect(jsSerialize(Math.sin)).toEqual('Math.sin') // can be broken with `global.sin = Math.sin` -- maybe if we run findFunction in a clean context? https://nodejs.org/api/vm.html#vm_vm_createcontext_sandbox
        expect(jsSerialize(Intl.NumberFormat.supportedLocalesOf)).toEqual('Intl.NumberFormat.supportedLocalesOf')
    })

    it('serializes functions', () => {
        expect(jsSerialize(() => 1)).toEqual('() => 1')
        expect(jsSerialize(x => x * 2)).toEqual('(x) => x * 2')
        expect(jsSerialize(function(x, y) {
            return x + y
        })).toWse("function(x, y) { return x + y; }")
        expect(jsSerialize(function mult(x, y) {
            return x * y
        })).toWse("function mult(x, y) { return x * y; }")
    })
})


it('serializes raw', () => {
    expect(jsSerialize(jsSerialize.raw('foo'))).toEqual('foo')
    expect(jsSerialize({context: jsSerialize.raw('__dirname')})).toEqual('{context:__dirname}')
})

it('serializes booleans', () => {
    expect(jsSerialize(true)).toEqual('true')
    expect(jsSerialize(false)).toEqual('false')

    expect(jsSerialize(true, {compact: true})).toEqual('!0')
    expect(jsSerialize(false, {compact: true})).toEqual('!1')
})

describe('objects', () => {
    it('serializes objects', () => {
        expect(jsSerialize({a: 1})).toEqual('{a:1}')
        expect(jsSerialize({})).toEqual('{}')
        expect(jsSerialize({foo: 'bar', baz: 9})).toEqual('{foo:"bar",baz:9}')
        expect(jsSerialize({'foo bar': 'baz', corge: 'Waldo'})).toEqual('{"foo bar":"baz",corge:"Waldo"}')
        let foo = Symbol.for('Foo')
        expect(jsSerialize({[foo]: 'bar'})).toEqual(`{[Symbol.for("Foo")]:"bar"}`)
    })

    it('quotes keyword property names', () => {
        expect(jsSerialize({
            class: 1,
            do: 2,
            finally: 3,
            for: 4,
            five: 5
        }, {safe: true})).toEqual(`{"class":1,"do":2,"finally":3,"for":4,five:5}`)
        expect(jsSerialize({
            class: 1,
            do: 2,
            finally: 3,
            for: 4,
            five: 5
        }, {safe: false})).toEqual(`{class:1,do:2,finally:3,for:4,five:5}`)
    })

    it('serializes toSource', () => {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toSource#Overriding_the_toSource()_method
        class Person {
            constructor(readonly name: string) {
            }

            toSource() {
                return `new Person(${JSON.stringify(this.name)})`
            }
        }

        let joe = new Person('Joe')

        expect(jsSerialize(joe)).toEqual(`new Person("Joe")`)
    })

    it('serializes toJSON', () => {
        // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior

        var obj = {
            foo: 'foo',
            toJSON: function() {
                return 'bar'
            }
        }

        expect(jsSerialize(obj)).toEqual('"bar"')
        expect(jsSerialize({x: obj})).toEqual('{x:"bar"}')
    })
})

describe('recursion', () => {
    it('passes options recursively', () => {
        expect(jsSerialize({foo: {bar: true}}, {compact: true})).toEqual('{foo:{bar:!0}}')
    })

    it('serializes recursive sets', () => {
        let s = new Set()
        // let rs = {s}
        s.add(s)
        expect(jsSerialize(s,{safe:false})).toEqual('($0=>($0=new Set,$0.add($0)))()');


        let o: any = {a: 'perfect'}
        o.circle = o
        const b = [o, 1, o]
        const input = {
            a: o,
            b: b,
            c: {d: b, e: o, f: new Set([o])}
        }
        // console.log(input)
        expect(jsSerialize(input, {safe: false})).toEqual('(($0,$1)=>({a:($0={},Object.assign($0,{a:"perfect",circle:$0})),b:($1=[],$1.push($0,1,$0),$1),c:{d:$1,e:$0,f:new Set([$0])}}))()')
    })

    it('serializes recursive objects', () => {
        let foo = {foo: 1}
        expect(jsSerialize({a: foo, b: foo}, {safe: false})).toEqual("($0=>({a:($0={},Object.assign($0,{foo:1})),b:$0}))()") // shorter: (($0)=>({a:$0,b:$0}))({foo:1})

        let o: any = {a: 'perfect'}
        o.circle = o
        expect(jsSerialize({apc: o}, {safe: false})).toEqual('($0=>({apc:($0={},Object.assign($0,{a:"perfect",circle:$0}))}))()')
        // expect(jsSerialize(o, {safe: false})).toEqual('(o=>(o={a:"perfect"},o.circle=o,o))()')
        // expect(jsSerialize(o, {safe: true})).toEqual('(function(o){return o={a:"perfect"},o.circle=o,o})()')
    })

    it('serializes recursive maps', () => {
        const m = new Map
        m.set(0,m)
        m.set(m,m)
        expect(jsSerialize(m)).toEqual("($0=>($0=new Map,$0.set(0,$0).set($0,$0)))()")
    })
})

describe('object modifiers', () => {
    it('supports frozen objects', () => {
        const frozen = {ans: 42}
        expect(jsSerialize(frozen)).toEqual('{ans:42}')
        Object.freeze(frozen)
        expect(jsSerialize(frozen)).toEqual('Object.freeze({ans:42})')
    })

    it('supports sealed objects', () => {
        const sealed = {ans: 42}
        Object.seal(sealed)
        expect(jsSerialize(sealed)).toEqual('Object.seal({ans:42})')
    })

    it('supports non-extensible objects', () => {
        const ext = {ans: 42}
        Object.preventExtensions(ext)
        expect(jsSerialize(ext)).toEqual('Object.preventExtensions({ans:42})')
    })
})

describe('references', () => {
    it('serializes map references', () => {
        const m = new Map
        expect(jsSerialize([m,m])).toEqual("($0=>[$0=new Map,$0])()")
    })

    it('serializes set references', () => {
        const s = new Set
        expect(jsSerialize([s,s])).toEqual("($0=>[$0=new Set,$0])()")
    })

    it('serializes object references', () => {
        const o = {}
        expect(jsSerialize([o,o])).toEqual("($0=>[$0={},$0])()")
    })

    it('deduplicates long strings', () => {
        expect(jsSerialize(['12345678901','abc','12345678901'])).toEqual('["12345678901","abc","12345678901"]')
        expect(jsSerialize(['123456789012','abc','123456789012'])).toEqual('($0=>[$0="123456789012","abc",$0])()')
    })

    it('serializes object frozen references', () => {
        const o = Object.freeze({})
        expect(jsSerialize([o,o])).toEqual("($0=>[$0=Object.freeze({}),$0])()")
    })

    it('serializes object recursive sealed references', () => {
        let o: any = {}
        o.ref = o
        Object.seal(o)
        expect(jsSerialize([o,o])).toEqual("($0=>[($0={},Object.seal(Object.assign($0,{ref:$0}))),$0])()")
    })

    it('serializes array references', () => {
        const a: any[] = []
        expect(jsSerialize([a,a])).toEqual("($0=>[$0=[],$0])()")

        const b = new Array(5)
        expect(jsSerialize([b,b])).toEqual("($0=>[$0=new Array(5),$0])()")

        let c = new Array(4)
        c[1] = 4
        expect(jsSerialize([c,c])).toEqual("($0=>[($0=new Array(4),$0[1]=4,$0),$0])()")
    })

    it('symbol references', () => {
        const s = Symbol()
        expect(jsSerialize([s,s])).toEqual("($0=>[$0=Symbol(),$0])()")
    })
})
