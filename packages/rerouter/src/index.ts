import Chalk from 'chalk';

// https://t-code.pl/blog/2016/11/Towards-server-side-routing-with-URI-Templates/
// https://www.npmjs.com/package/urijs
// https://tools.ietf.org/html/rfc6570
// import {URI} from 'uri-template-lite';
// import UriTemplate from 'uri-templates';
//
// const routes = {
//     foo: '/xschedule/{year:4}-{month:2}-{day:2}',
//     scheduleYearMonthDay: '/schedule/{year:4}-{month:2}-{day:2}',
//     scheduleYearMonth: '/schedule/{year:4}-{month:2}',
//     scheduleYear: '/schedule/{year:4}',
//     scheduleOptDate: '/schedule{/date?}',
//     schedule: '/schedule',
//     dashboard: '/',
// }
//
// function findMatch(url: string) {
//     for(const [k,v] of Object.entries(routes)) {
//         if(v.match(url) !== false) return k;
//     }
//     return null;
// }
//
//
// // const url = '/schedule/2019-12';
// const url = '/schedule';
//
// for(const [k,v] of Object.entries(routes)) {
//     const templ = new URI.Template(v);
//     const match = templ.match(url);
//     console.log('uri-template-lite',k,match);
//
//     // const templ2 = new UriTemplate(v);
//     // const match2 = templ2.fromUri(v);
//     // console.log('uri-templates',k,match2);
// }


import UriTemplate from "./uri-template";
import testcases from './testcases/spec-examples.json';
import {inspect} from "util";

for(const [name,test] of Object.entries(testcases)) {

    for(const [input,expected] of test.testcases) {
        const templ = new UriTemplate(input);
        const expanded = templ.expand(test.variables);
        const pass = Array.isArray(expected) ? expected.includes(expanded) : expected === expanded;

        console.log(pass ? Chalk.green('✔') : Chalk.red('✘'),Chalk.cyan('template:'),input,Chalk.cyan('expected:'),expected,Chalk.cyan('actual:'),expanded)

        if(!pass) {
            log(test.variables,templ);
            process.exit(1);
        }
    }
}



function log(...vars: any) {
    console.log(vars.map((v:any) => inspect(v, {colors:true,depth:4,showProxy:true,breakLength:120,maxArrayLength:10})).join('  '));
}
