import UriTemplate from "./uri-template";
import specExamples from './testcases/spec-examples.json';
import extendedTests from './testcases/extended-tests.json';
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
    for (const testSuite of [specExamples]) {
        for (const [name, test] of Object.entries(testSuite)) {
            describe(name + ' ' + JSON.stringify(test.variables), () => {
                for (const [input, expected] of test.testcases) {
                    const matchingUrls = Array.isArray(expected) ? expected : [expected];
                    it(`${input} -> ${matchingUrls[0]}`, () => {
                        const templ = new UriTemplate(input);
                        console.log('Regex=',templ.re);
                        for(const mu of matchingUrls) {
                            console.log('URL=',mu);
                            const match = templ.match(mu);
                            console.log('Params=',match.params);
                            expect(match).to.not.be.null;
                            if (match.params) {
                                for (const k of Object.keys(match.params)) {
                                    expect(match.params[k]).to.equal(test.variables[k], k);
                                }
                            }
                        }
                    })
                }
            })
        }
    }
})
