import {inspect} from "util";

export default function log(...vars: any) {
    console.log(vars.map((v: any) => inspect(v, {
        colors: true,
        depth: 4,
        showProxy: true,
        breakLength: 120,
        maxArrayLength: 10
    })).join('  '));
}
