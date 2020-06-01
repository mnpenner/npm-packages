import * as util from 'util';

export class Foo {
    /**
     * The coolest number.
     * @type {bigint}
     */
    bar: bigint = 1337n
}

const o: any = {};
const f = new Foo;
console.log(util.inspect(o?.baz ?? f.bar, {colors: true}), process.env.API_KEY);
throw new Error("typescript trace plz");
