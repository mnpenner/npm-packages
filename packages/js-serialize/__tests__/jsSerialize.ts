import jsSerialize from '../'
import Chai, {Assertion, expect} from 'chai'

Assertion.addMethod('wse', function(this: Chai.AssertionStatic, str: string) {
    new Assertion(this._obj).to.be.a('string')
    const normalized = String(this._obj)
        .trim()
        // .replace(/(\w)\s+(\W)/g, '$1$2')
        // .replace(/(\W)\s+(\w)/g, '$1$2')
        .replace(/\s+/g, ' ')
    this.assert(normalized === str
        , "expected #{this} to be whitespace-normalized equal to #{exp} but got #{act}"
        , "expected #{this} to not be whitespace-normalized equal to #{exp} but got #{act}"
        , str
        , normalized
    )
})

describe('strings', () => {
    it('serializes strings', () => {
        expect(jsSerialize('foo')).to.equal('"foo"')
        expect(jsSerialize(new String('bar'))).to.equal('new String("bar")')
    })

    it('encodes unicode using escape sequences', () => {
        expect(jsSerialize('\u303a')).to.equal('"\\u303a"')
        expect(jsSerialize('\u{12345}')).to.equal('"\\u{12345}"')
        expect(jsSerialize('\x1F\x7F')).to.equal('"\\x1f\\x7f"')
        expect(jsSerialize('he"l\\lo')).to.equal('"he\\"l\\\\lo"')
        expect(jsSerialize('0\u12345')).to.equal('"0\\u12345"')
        expect(jsSerialize('\x001')).to.equal('"\\x001"') // \01 would be incorrect!
        expect(jsSerialize('\u{1f469}')).to.equal('"\\u{1f469}"')
    })

    it('uses single-character escape sequences', () => {
        expect(jsSerialize('\b\f\n\r\t\v"\\', {safe: false})).to.equal('"\\b\\f\\n\\r\\t\\v\\"\\\\"')
        expect(jsSerialize('\b\f\n\r\t\v"\\', {safe: true})).to.equal('"\\b\\f\\n\\r\\t\\x0B\\"\\\\"')
    })
})

describe('numbers', () => {
    it('serializes numbers', () => {
        expect(jsSerialize(1)).to.equal('1')
        expect(jsSerialize(3.14)).to.equal('3.14')
        expect(jsSerialize(Math.PI)).to.equal('Math.PI')
        expect(jsSerialize(Number.EPSILON)).to.equal('Number.EPSILON')
        expect(jsSerialize(0)).to.equal('0')
        expect(jsSerialize(new Number(2))).to.equal('new Number(2)')
        expect(jsSerialize(244838016401135, {compact: true})).to.equal('0xdeadcafebeef')
        expect(jsSerialize(244838016401135.1, {compact: true})).to.equal('244838016401135.1')
        expect(jsSerialize(0xFF, {compact: true})).to.equal('255')
    })

    it('serializes negative zero', () => {
        expect(jsSerialize(-0)).to.equal('-0')
    })

    it('serializes Infinity', () => {
        expect(jsSerialize(Infinity)).to.equal('Infinity')
        expect(jsSerialize(-Infinity)).to.equal('-Infinity')

        expect(jsSerialize(Infinity, {compact: true})).to.equal('1/0')
        expect(jsSerialize(-Infinity, {compact: true})).to.equal('1/-0')
    })

    it('serializes NaN', () => {
        expect(jsSerialize(NaN)).to.equal('NaN')
        expect(jsSerialize(Number.NaN)).to.equal('NaN')
        expect(jsSerialize('wat' - 1)).to.equal('NaN')
    })

    it('serializes BigInts', () => {
        expect(jsSerialize(36893488147419103232n)).to.equal('36893488147419103232n')
        expect(jsSerialize(-1n)).to.equal('-1n')
        expect(jsSerialize(0n)).to.equal('0n')
    })
})

it('serializes regexes', () => {
    expect(jsSerialize(/foo/i)).to.equal('/foo/i')
    expect(jsSerialize(new RegExp('bar', 'myu'))).to.equal('/bar/muy')
    expect(jsSerialize(/foo\nbar/)).to.equal('/foo\\nbar/')
})

it('serializes sets', () => {
    expect(jsSerialize(new Set([3, 1, 2]))).to.equal('new Set([3,1,2])')
    expect(jsSerialize(new Set([]))).to.equal('new Set')
})

it('serializes maps', () => {
    expect(jsSerialize(new Map([["a", 1], ["b", 2]]))).to.equal('new Map([["a",1],["b",2]])')
    expect(jsSerialize(new Map([]))).to.equal('new Map')
})

it('serializes dates', () => {
    // expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'))).to.equal('new Date("2017-05-04T16:55:50.457Z")'); // iOS can't handle ISO dates?!
    expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'), {compact: false})).to.equal('new Date(Date.UTC(2017,4,4,16,55,50,457))')
    expect(jsSerialize(new Date('2017-05-04T16:55:50.457Z'), {compact: true})).to.equal('new Date(1493916950457)')
    expect(jsSerialize(new Date(1642572794510), {compact: true})).to.equal('new Date(1642572794510)')
    expect(jsSerialize(new Date(1642572794510), {compact: false})).to.equal('new Date(Date.UTC(2022,0,19,6,13,14,510))')
    expect(jsSerialize(new Date(1642572794000), {compact: false})).to.equal('new Date(Date.UTC(2022,0,19,6,13,14))')
    expect(jsSerialize(new Date(Date.UTC(2022, 0, 19)), {compact: false})).to.equal('new Date(Date.UTC(2022,0,19))')
    expect(jsSerialize(new Date(Date.UTC(2022, 0, 19)), {compact: true})).to.equal('new Date(1642550400000)')
})

it('serializes scripts', () => {
    expect(jsSerialize('<script>alert("injection")</script>')).to.equal('"<script>alert(\\"injection\\")<\\/script>"')
    expect(jsSerialize(() => document.write('</ScRiPt >'))).to.equal('() => document.write(\'<\\/ScRiPt >\')')
})

it('serializes arrays', () => {
    expect(jsSerialize([])).to.equal('[]')
    expect(jsSerialize([3, 1, 2])).to.equal('[3,1,2]')
    expect(jsSerialize(new Array(4))).to.equal('new Array(4)')
    expect(jsSerialize([undefined, undefined, undefined, undefined])).to.equal('[undefined,undefined,undefined,undefined]')
    let a = new Array(4)
    a[1] = 4
    expect(jsSerialize(a)).to.equal('[,4,,,]')
})

describe('symbols', () => {
    it('serializes symbols', () => {
        expect(jsSerialize(Symbol.for('foo'))).to.equal('Symbol.for("foo")')
        expect(jsSerialize(Symbol())).to.equal('Symbol()') // this isn't the same Symbol!
        expect(jsSerialize(Symbol('bar'))).to.equal('Symbol("bar")') // nor is this

        expect(jsSerialize({[Symbol.for('foo')]: 'foo'})).to.equal(`{[Symbol.for("foo")]:"foo"}`)
    })

    it('serializes well-known symbols', () => {
        const wellKnownSymbols = ["hasInstance", "isConcatSpreadable", "iterator", "match", "replace", "search", "species", "split", "toPrimitive", "toStringTag", "unscopables"]
        for(let wks of wellKnownSymbols) {
            expect(jsSerialize(Symbol[wks])).to.equal(`Symbol.${wks}`)
        }
    })
})

it('serializes null', () => {
    expect(jsSerialize(null)).to.equal('null')
})

it('serializes undefined', () => {
    expect(jsSerialize(undefined)).to.equal('undefined')
})

describe('functions', () => {
    it('serializes native functions', () => {
        expect(jsSerialize(isNaN)).to.equal('isNaN')
        expect(jsSerialize(Number.isNaN)).to.equal('Number.isNaN')
        expect(jsSerialize(Math.sin)).to.equal('Math.sin') // can be broken with `global.sin = Math.sin` -- maybe if we run findFunction in a clean context? https://nodejs.org/api/vm.html#vm_vm_createcontext_sandbox
        expect(jsSerialize(Intl.NumberFormat.supportedLocalesOf)).to.equal('Intl.NumberFormat.supportedLocalesOf')
    })

    it('serializes functions', () => {
        expect(jsSerialize(() => 1)).to.equal('() => 1')
        expect(jsSerialize(x => x * 2)).to.equal('x => x * 2')
        expect(jsSerialize(function(x, y) {
            return x + y
        })).to.wse("function (x, y) { return x + y; }")
        expect(jsSerialize(function mult(x, y) {
            return x * y
        })).to.wse("function mult(x, y) { return x * y; }")
    })
})


it('serializes raw', () => {
    expect(jsSerialize(jsSerialize.raw('foo'))).to.equal('foo')
    expect(jsSerialize({context: jsSerialize.raw('__dirname')})).to.equal('{context:__dirname}')
})

it('serializes booleans', () => {
    expect(jsSerialize(true)).to.equal('true')
    expect(jsSerialize(false)).to.equal('false')

    expect(jsSerialize(true, {compact: true})).to.equal('!0')
    expect(jsSerialize(false, {compact: true})).to.equal('!1')
})

describe('objects', () => {
    it('serializes objects', () => {
        expect(jsSerialize({a: 1})).to.equal('{a:1}')
        expect(jsSerialize({})).to.equal('{}')
        expect(jsSerialize({foo: 'bar', baz: 9})).to.equal('{foo:"bar",baz:9}')
        expect(jsSerialize({'foo bar': 'baz', corge: 'Waldo'})).to.equal('{"foo bar":"baz",corge:"Waldo"}')
        let foo = Symbol.for('Foo')
        expect(jsSerialize({[foo]: 'bar'})).to.equal(`{[Symbol.for("Foo")]:"bar"}`)
    })

    it('quotes keyword property names', () => {
        expect(jsSerialize({
            class: 1,
            do: 2,
            finally: 3,
            for: 4,
            five: 5
        }, {safe: true})).to.equal(`{"class":1,"do":2,"finally":3,"for":4,five:5}`)
        expect(jsSerialize({
            class: 1,
            do: 2,
            finally: 3,
            for: 4,
            five: 5
        }, {safe: false})).to.equal(`{class:1,do:2,finally:3,for:4,five:5}`)
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

        expect(jsSerialize(joe)).to.equal(`new Person("Joe")`)
    })

    it('serializes toJSON', () => {
        // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior

        var obj = {
            foo: 'foo',
            toJSON: function() {
                return 'bar'
            }
        }

        expect(jsSerialize(obj)).to.equal('"bar"')
        expect(jsSerialize({x: obj})).to.equal('{x:"bar"}')
    })
})

describe('recursion', () => {
    it('passes options recursively', () => {
        expect(jsSerialize({foo: {bar: true}}, {compact: true})).to.equal('{foo:{bar:!0}}')
    })

    it('serializes recursive sets', () => {
        let s = new Set()
        // let rs = {s}
        s.add(s)
        expect(jsSerialize(s,{safe:false})).to.equal('($0=>($0=new Set,$0.add($0)))()');


        let o: any = {a: 'perfect'}
        o.circle = o
        const b = [o, 1, o]
        const input = {
            a: o,
            b: b,
            c: {d: b, e: o, f: new Set([o])}
        }
        // console.log(input)
        expect(jsSerialize(input, {safe: false})).to.equal('(($0,$1)=>({a:($0={},Object.assign($0,{a:"perfect",circle:$0})),b:($1=[],$1.push($0,1,$0),$1),c:{d:$1,e:$0,f:new Set([$0])}}))()')
    })

    it('serializes recursive objects', () => {
        let foo = {foo: 1}
        expect(jsSerialize({a: foo, b: foo}, {safe: false})).to.equal("($0=>({a:($0={},Object.assign($0,{foo:1})),b:$0}))()") // shorter: (($0)=>({a:$0,b:$0}))({foo:1})

        let o: any = {a: 'perfect'}
        o.circle = o
        expect(jsSerialize({apc: o}, {safe: false})).to.equal('($0=>({apc:($0={},Object.assign($0,{a:"perfect",circle:$0}))}))()')
        // expect(jsSerialize(o, {safe: false})).to.equal('(o=>(o={a:"perfect"},o.circle=o,o))()')
        // expect(jsSerialize(o, {safe: true})).to.equal('(function(o){return o={a:"perfect"},o.circle=o,o})()')
    })

    it('serializes recursive maps', () => {
        const m = new Map
        m.set(0,m)
        m.set(m,m)
        expect(jsSerialize(m)).to.equal("($0=>($0=new Map,$0.set(0,$0).set($0,$0)))()")
    })
})

describe('object modifiers', () => {
    it('supports frozen objects', () => {
        const frozen = {ans: 42}
        expect(jsSerialize(frozen)).to.equal('{ans:42}')
        Object.freeze(frozen)
        expect(jsSerialize(frozen)).to.equal('Object.freeze({ans:42})')
    })

    it('supports sealed objects', () => {
        const sealed = {ans: 42}
        Object.seal(sealed)
        expect(jsSerialize(sealed)).to.equal('Object.seal({ans:42})')
    })

    it('supports non-extensible objects', () => {
        const ext = {ans: 42}
        Object.preventExtensions(ext)
        expect(jsSerialize(ext)).to.equal('Object.preventExtensions({ans:42})')
    })
})

describe('references', () => {
    it('serializes map references', () => {
        const m = new Map
        expect(jsSerialize([m,m])).to.equal("($0=>[$0=new Map,$0])()")
    })

    it('serializes set references', () => {
        const s = new Set
        expect(jsSerialize([s,s])).to.equal("($0=>[$0=new Set,$0])()")
    })

    it('serializes object references', () => {
        const o = {}
        expect(jsSerialize([o,o])).to.equal("($0=>[$0={},$0])()")
    })

    it('deduplicates long strings', () => {
        expect(jsSerialize(['12345678901','abc','12345678901'])).to.equal('["12345678901","abc","12345678901"]')
        expect(jsSerialize(['123456789012','abc','123456789012'])).to.equal('($0=>[$0="123456789012","abc",$0])()')
    })

    it('serializes object frozen references', () => {
        const o = Object.freeze({})
        expect(jsSerialize([o,o])).to.equal("($0=>[$0=Object.freeze({}),$0])()")
    })

    it('serializes object recursive sealed references', () => {
        let o: any = {}
        o.ref = o
        Object.seal(o)
        expect(jsSerialize([o,o])).to.equal("($0=>[($0={},Object.seal(Object.assign($0,{ref:$0}))),$0])()")
    })

    it('serializes array references', () => {
        const a: any[] = []
        expect(jsSerialize([a,a])).to.equal("($0=>[$0=[],$0])()")

        const b = new Array(5)
        expect(jsSerialize([b,b])).to.equal("($0=>[$0=new Array(5),$0])()")

        let c = new Array(4)
        c[1] = 4
        expect(jsSerialize([c,c])).to.equal("($0=>[($0=new Array(4),$0[1]=4,$0),$0])()")
    })

    it('symbol references', () => {
        const s = Symbol()
        expect(jsSerialize([s,s])).to.equal("($0=>[$0=Symbol(),$0])()")
    })
})
