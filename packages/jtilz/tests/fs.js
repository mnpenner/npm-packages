import * as fs from '../fs';

fs.getFiles(`${__dirname}/dir`).then(console.log);