const Jtilz = require('../dist/node');

let input = 'foo💩bar/../baz';
let output = Jtilz.encodeParam(input);
console.log(output,input === decodeURIComponent(output));