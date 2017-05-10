import * as fs from '../src/node/fs';

fs.getFiles(`${__dirname}/dir`).then(console.log);