import * as url from '../src/url';

let input = 'foo💩bar/../baz';
let output = url.encodeParam(input);
console.log(output,input === decodeURIComponent(output));