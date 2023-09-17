import {UriParams, UriTemplate, UrlParamValue} from "./uri-template"
import specExamples from './testcases/spec-examples.json' assert {type: "json"}
import extendedTests from './testcases/extended-tests.json' assert {type: "json"}
import matchCases from './testcases/match-cases.json' assert {type: "json"}
import {expect, describe, it} from 'bun:test'

type TestCase = [input: string, output: string | string[]]
type TestExample = {
    level: number
    variables: Record<string, UrlParamValue>,
    testcases: TestCase[]
}
type TestSuite = Record<string, TestExample>

describe('UriTemplate.expand', () => {
    for(const testSuite of [specExamples, extendedTests] as unknown as TestSuite[]) {
        for(const [name, test] of Object.entries(testSuite)) {
            describe(name + ' ' + JSON.stringify(test.variables), () => {
                for(const [input, expected] of test.testcases) {
                    it(`${input} -> ${Array.isArray(expected) ? expected[0] : expected}`, () => {
                        const templ = new UriTemplate(input)
                        const expanded = templ.expand(test.variables)

                        if(Array.isArray(expected)) {
                            // TODO: this should be the other way around, like `toBeOneOf`:
                            // https://discord.com/channels/876711213126520882/1152457503595053119
                            expect(expected).toContain(expanded)
                        } else {
                            expect(expanded).toEqual(expected)
                        }
                    })
                }
            })
        }
    }
})

describe('UriTemplate.match', () => {
    for(const testSuite of [matchCases] as unknown as TestSuite[]) {
        for(const [name, test] of Object.entries(testSuite)) {
            describe(name + ' ' + JSON.stringify(test.variables), () => {
                for(const [input, expected] of test.testcases) {
                    const matchingUrls = Array.isArray(expected) ? expected : [expected]
                    it(`${input} -> ${matchingUrls[0]}`, () => {
                        const templ = new UriTemplate(input)

                        // console.log('Regex=',templ.matchRegex);
                        for(const mu of matchingUrls) {
                            // console.log('URL=',mu);
                            const match = templ.match(mu)
                            expect(match).not.toBeNull()
                            // console.log('match.params=',match.params);
                            if(match) {
                                for(const k of Object.keys(match.params)) {
                                    expect(match.params[k]).toEqual(test.variables[k])
                                }
                            }
                        }
                    })
                }
            })
        }
    }


    describe("Custom tests", () => {
        it("matches schedule page", () => {
            const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}')
            const match = templ.match('/schedule/2019-12-31')
            expect(match).toEqual({
                "params": {
                    "day": 31,
                    "month": 12,
                    "year": 2019,
                },
                "score": 15
            })
        })

        it("does not matches schedule when query params are appended", () => {
            const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}')
            const match = templ.match('/schedule/2019-12-31?foo=bar&baz=bux')
            expect(match).toBeNull()
        })

        it("matches schedule w/ extraneous vars", () => {
            const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}{?foo,q*}')
            const match = templ.match('/schedule/2019-12-31?foo=bar&baz=bux')
            expect(match).toEqual({score: 16, params: {year: 2019, month: 12, day: 31, foo: 'bar', q: {baz: 'bux'}}})
        })

        it("matches root", () => {
            const templ = new UriTemplate('/')
            const match = templ.match('/')
            expect(match).toEqual({score: 3, params: {}})
        })

        it("matches {+path}/here", () => {
            const templ = new UriTemplate('{+path}/here')
            const match = templ.match('/foo/bar/here')
            expect(match).toEqual({score: 5, params: {path: '/foo/bar'}})
        })

        it("matches lists", () => {
            const templ = new UriTemplate('foo{list*}bar')
            const match = templ.match('foobar,bazbar')
            expect(match).toEqual({score: 8, params: {list: ['bar', 'baz']}})
        })

        it("matches lists2", () => {
            const templ = new UriTemplate('foo{list}bar')
            const match = templ.match('foobar,bazbar')
            expect(match).toEqual({score: 8, params: {list: 'bar,baz'}})
        })

        it("matches kwargs", () => {
            const templ = new UriTemplate('foo{?args}bar')
            const match = templ.match('foo?args=foobar')
            expect(match).toEqual({score: 8, params: {args: 'foo'}})
        })

        it("matches kwargs2", () => {
            const templ = new UriTemplate('foo{?args*}bar')
            const match = templ.match('foo?args=foobar')
            expect(match).toEqual({score: 5, params: {args: {args: 'foo'}}})
        })

        it("matches kwargs3", () => {
            const templ = new UriTemplate('foo{?args*}bar')
            const match = templ.match('foobar')
            expect(match).toEqual({score: 5, params: {args: {}}})
        })

        it("matches kwargs3 score", () => {
            const templ = new UriTemplate('foobar')
            const match = templ.match('foobar')
            expect(match).toEqual({score: 3, params: {}}) // TODO: rethink this scoring
        })

        it("max-length", () => {
            // https://datatracker.ietf.org/doc/html/rfc6570#section-2.4.1
            const vars = {
                var: 'value',
                semi: ';',
            } satisfies UriParams
            expect(new UriTemplate('{var}').expand(vars)).toEqual('value')
            expect(new UriTemplate('{var:20}').expand(vars)).toEqual('value')
            expect(new UriTemplate('{var:3}').expand(vars)).toEqual('val')
            expect(new UriTemplate('{semi}').expand(vars)).toEqual('%3B')
            expect(new UriTemplate('{semi:2}').expand(vars)).toEqual('%3B')
        })

        it("explode", () => {
            // https://datatracker.ietf.org/doc/html/rfc6570#section-2.4.2
            const vars = {
                year: [1965, 2000, 2012],
                dom: ['example', 'com'],
            } satisfies UriParams
            expect(new UriTemplate('find{?year*}').expand(vars)).toEqual('find?year=1965&year=2000&year=2012')
            expect(new UriTemplate('www{.dom*}').expand(vars)).toEqual('www.example.com')
        })

        describe("Expression Expansion", () => {
            //https://datatracker.ietf.org/doc/html/rfc6570#section-3.2
            const vars = {
                count: ["one", "two", "three"],
                dom: ["example", "com"],
                dub: "me/too",
                hello: "Hello World!",
                half: "50%",
                var: "value",
                who: "fred",
                base: "http://example.com/home/",
                path: "/foo/bar",
                list: ["red", "green", "blue"],
                keys: [["semi", ";"], ["dot", "."], ["comma", ","]],
                v: "6",
                x: "1024",
                y: "768",
                empty: "",
                empty_keys: [],
                undef: null,
            } satisfies UriParams

            it("Variable Expansion", () => {
                // https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.1
                expect(new UriTemplate('{count}').expand(vars)).toEqual('one,two,three')
                expect(new UriTemplate('{count*}').expand(vars)).toEqual('one,two,three')
                expect(new UriTemplate('{/count}').expand(vars)).toEqual('/one,two,three')
                expect(new UriTemplate('{/count*}').expand(vars)).toEqual('/one/two/three')
                expect(new UriTemplate('{;count}').expand(vars)).toEqual(';count=one,two,three')
                expect(new UriTemplate('{;count*}').expand(vars)).toEqual(';count=one;count=two;count=three')
                expect(new UriTemplate('{?count}').expand(vars)).toEqual('?count=one,two,three')
                expect(new UriTemplate('{?count}').expand(vars)).toEqual('?count=one,two,three')
                expect(new UriTemplate('{?count*}').expand(vars)).toEqual('?count=one&count=two&count=three')
                expect(new UriTemplate('{&count*}').expand(vars)).toEqual('&count=one&count=two&count=three')
            })

            it("Variable Expansion", () => {
                // https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.2
                expect(new UriTemplate('{var}').expand(vars)).toEqual('value')
                expect(new UriTemplate('{hello}').expand(vars)).toEqual('Hello%20World%21')
                expect(new UriTemplate('{half}').expand(vars)).toEqual('50%25')
                expect(new UriTemplate('O{empty}X').expand(vars)).toEqual('OX')
                expect(new UriTemplate('O{undef}X').expand(vars)).toEqual('OX')
                expect(new UriTemplate('{x,y}').expand(vars)).toEqual('1024,768')
                expect(new UriTemplate('{x,hello,y}').expand(vars)).toEqual('1024,Hello%20World%21,768')
                expect(new UriTemplate('?{x,empty}').expand(vars)).toEqual('?1024,')
                expect(new UriTemplate('?{x,undef}').expand(vars)).toEqual('?1024')
                expect(new UriTemplate('?{undef,y}').expand(vars)).toEqual('?768')
                expect(new UriTemplate('{var:3}').expand(vars)).toEqual('val')
                expect(new UriTemplate('{var:30}').expand(vars)).toEqual('value')
                expect(new UriTemplate('{list}').expand(vars)).toEqual('red,green,blue')
                expect(new UriTemplate('{list*}').expand(vars)).toEqual('red,green,blue')
                expect(new UriTemplate('{keys}').expand(vars)).toEqual('semi,%3B,dot,.,comma,%2C')
                expect(new UriTemplate('{keys*}').expand(vars)).toEqual('semi=%3B,dot=.,comma=%2C')
            })

            it("Reserved Expansion: {+var}", () => {
                // https://datatracker.ietf.org/doc/html/rfc6570#section-3.2.3
                expect(new UriTemplate('{+var}').expand(vars)).toEqual('value')
                expect(new UriTemplate('{+hello}').expand(vars)).toEqual('Hello%20World!')
                expect(new UriTemplate('{+half}').expand(vars)).toEqual('50%25')
                expect(new UriTemplate('{base}index').expand(vars)).toEqual('http%3A%2F%2Fexample.com%2Fhome%2Findex')
                expect(new UriTemplate('{+base}index').expand(vars)).toEqual('http://example.com/home/index')
                expect(new UriTemplate('O{+empty}X').expand(vars)).toEqual('OX')
                expect(new UriTemplate('O{+undef}X').expand(vars)).toEqual('OX')
                expect(new UriTemplate('{+path}/here').expand(vars)).toEqual('/foo/bar/here')
                expect(new UriTemplate('here?ref={+path}').expand(vars)).toEqual('here?ref=/foo/bar')
                expect(new UriTemplate('up{+path}{var}/here').expand(vars)).toEqual('up/foo/barvalue/here')
                expect(new UriTemplate('{+x,hello,y}').expand(vars)).toEqual('1024,Hello%20World!,768')
                expect(new UriTemplate('{+path,x}/here').expand(vars)).toEqual('/foo/bar,1024/here')
                expect(new UriTemplate('{+path:6}/here').expand(vars)).toEqual('/foo/b/here')
                expect(new UriTemplate('{+list}').expand(vars)).toEqual('red,green,blue')
                expect(new UriTemplate('{+list*}').expand(vars)).toEqual('red,green,blue')
                expect(new UriTemplate('{+keys}').expand(vars)).toEqual('semi,;,dot,.,comma,,')
                expect(new UriTemplate('{+keys*}').expand(vars)).toEqual('semi=;,dot=.,comma=,')
            })
        })
    })
})
