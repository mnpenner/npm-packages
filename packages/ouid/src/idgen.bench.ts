#!bun --expose-gc
import { run, bench } from 'mitata';
import {OrderedTypedIdGenerator} from './OrderedTypedIdGenerator'

const enum IdType {
    USER,
    COMMENT,
    POST,
}


const generator = new OrderedTypedIdGenerator<IdType>

bench('idgen', () => generator.generate(IdType.COMMENT))

await run()
