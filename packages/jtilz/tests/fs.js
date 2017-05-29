import * as fs from '../src/fs.node';

fs.getFiles(`${__dirname}/dir`).then(console.log);