import {UriTemplate,UrlParamValue} from "./uri-template"
import specExamples from './testcases/spec-examples.json' assert {type: "json"}
import extendedTests from './testcases/extended-tests.json' assert {type: "json"}
import matchCases from './testcases/match-cases.json' assert {type: "json"}
import {expect, describe, it} from 'bun:test'

type TestCase = [input:string, output:string|string[]]
type TestExample = {
    level: number
    variables: Record<string,UrlParamValue>,
    testcases: TestCase[]
}
type TestSuite = Record<string,TestExample>

describe('UriTemplate.expand', () => {
    for(const testSuite of [specExamples, extendedTests] as unknown as TestSuite[]) {
        for(const [name, test] of Object.entries(testSuite)) {
            describe(name + ' ' + JSON.stringify(test.variables), () => {
                for(const [input, expected] of test.testcases) {
                    it(`${input} -> ${Array.isArray(expected) ? expected[0] : expected}`, () => {
                        const templ = new UriTemplate(input)
                        const expanded = templ.expand(test.variables)

                        if(Array.isArray(expected)) {
                            // TODO: this should be the other way around, like `toBeOneOf`: https://discord.com/channels/876711213126520882/1152457503595053119
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
    })
})
