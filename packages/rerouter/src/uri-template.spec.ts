import UriTemplate from "./uri-template";
import specExamples from './testcases/spec-examples.json';
import extendedTests from './testcases/extended-tests.json';
import {expect} from 'chai';

for(const testSuite of [specExamples,extendedTests]) {
    for (const [name, test] of Object.entries(testSuite)) {
        describe(name + ' ' + JSON.stringify(test.variables), () => {
            for (const [input, expected] of test.testcases) {
                it(`${input} -> ${Array.isArray(expected) ? expected[0] : expected}`, () => {
                    const templ = new UriTemplate(input);
                    const expanded = templ.expand(test.variables);

                    if (Array.isArray(expected)) {
                        expect(expected).to.include(expanded);
                    } else {
                        expect(expected).to.equal(expanded);
                    }
                })
            }
        })
    }
}
