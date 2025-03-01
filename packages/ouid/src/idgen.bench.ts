#!bun --expose-gc
import { run, bench } from 'mitata';
import {TypedIdGenerator} from './idgen'

const enum IdType {
    USER,
    COMMENT,
    POST,
}


const generator = new TypedIdGenerator<IdType>

bench('idgen', () => generator.generate(IdType.COMMENT))

await run()
