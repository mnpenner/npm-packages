import UriTemplate from "./uri-template";
import specExamples from './testcases/spec-examples.json';
import extendedTests from './testcases/extended-tests.json';
import matchCases from './testcases/match-cases.json';
import {expect} from 'chai';

// describe('UriTemplate.expand', () => {
//     for (const testSuite of [specExamples, extendedTests]) {
//         for (const [name, test] of Object.entries(testSuite)) {
//             describe(name + ' ' + JSON.stringify(test.variables), () => {
//                 for (const [input, expected] of test.testcases) {
//                     it(`${input} -> ${Array.isArray(expected) ? expected[0] : expected}`, () => {
//                         const templ = new UriTemplate(input);
//                         const expanded = templ.expand(test.variables);
//
//                         if (Array.isArray(expected)) {
//                             expect(expected).to.include(expanded);
//                         } else {
//                             expect(expected).to.equal(expanded);
//                         }
//                     })
//                 }
//             })
//         }
//     }
// })

describe('UriTemplate.match', () => {
    for (const testSuite of [matchCases]) {
        for (const [name, test] of Object.entries(testSuite)) {
            describe(name + ' ' + JSON.stringify(test.variables), () => {
                for (const [input, expected] of test.testcases) {
                    const matchingUrls = Array.isArray(expected) ? expected : [expected];
                    it(`${input} -> ${matchingUrls[0]}`, () => {
                        const templ = new UriTemplate(input);
                        console.log('Regex=',templ.matchRegex);
                        for(const mu of matchingUrls) {
                            console.log('URL=',mu);
                            const match = templ.match(mu);
                            expect(match).to.not.be.null;
                            console.log('match.params=',match.params);
                            if (match.params) {
                                for (const k of Object.keys(match.params)) {
                                    expect(match.params[k]).to.eql(test.variables[k], k);
                                }
                            }
                        }
                    })
                }
            })
        }
    }


    it("matches schedule page", () => {
        const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}');
        const match = templ.match('/schedule/2019-12-31');
        expect(match).to.eql({
            "params": {
                "day": 31,
                "month": 12,
                "year": 2019,
            },
            "score": 15
        });
    })

    it("does not matches schedule when query params are appended", () => {
        const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}');
        const match = templ.match('/schedule/2019-12-31?foo=bar&baz=bux');
        expect(match).to.be.null;
    })

    it("matches schedule w/ extraneous vars", () => {
        const templ = new UriTemplate('/schedule/{year:int:4}-{month:int:2}-{day:int:2}{?foo,q*}');
        const match = templ.match('/schedule/2019-12-31?foo=bar&baz=bux');
        expect(match).to.eql({score: 16, params: {year: 2019, month: 12, day: 31, foo: 'bar', q: {baz: 'bux'}}})
    })

    it("matches root", () => {
        const templ = new UriTemplate('/');
        const match = templ.match('/');
        expect(match).to.eql({score:3,params:{}})
    })

    it("matches {+path}/here", () => {
        const templ = new UriTemplate('{+path}/here');
        const match = templ.match('/foo/bar/here');
        expect(match).to.eql({score:5,params:{path:'/foo/bar'}})
    })
})
