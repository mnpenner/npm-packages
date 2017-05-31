const {getFiles} = require('../dist/node');

getFiles(`${__dirname}/dir`).then(console.log);
getFiles(`${__dirname}/dir`,false).then(console.log);