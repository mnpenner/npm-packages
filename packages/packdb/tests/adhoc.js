const PackDB = require('../PackDB');

let db = new PackDB(`${__dirname}/db.json`);

const baz = {baz: 9, quux: {duck: 6}};
db.data.foo = 5;
db.data.bar = baz;
db.data.bar.baz = 10;
db.data.bar.quux.duck = 999;

baz.quux.duck = 777;
delete db.data.bar;
delete db.data.bar; // should not trigger notifcation -- property was already deleted
baz.quux.duck = 666;  // should not trigger notification -- 'bar' was detached

console.log(db.data);