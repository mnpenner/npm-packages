import * as fs from 'fs'
import type {WriteStream} from "fs";

export default class CsvWriter {
    private stream: WriteStream;

    constructor(filename: string) {
        // TODO: open for writing instead of creating a stream?
        this.stream = fs.createWriteStream(filename)
    }

    writeLine(line: SupportedTypes[]) {
        this.stream.write(line.map(escape).join(',')+"\r\n");
    }

    close() {
        this.stream.end()
    }
}

function freeze(obj: object) {
    // deep freeze? https://github.com/christophehurpeau/deep-freeze-es6/blob/master/index.js
    return Object.freeze(Object.assign(Object.create(null),obj))
}

const B64_MAP: Record<string,string> = freeze({
    '+': '-',
    '/': '_',
})

function base64(b: Buffer): string {
    return b.toString('base64').replace(/={1,2}$/,'').replace(/[+\/]/g, x => B64_MAP[x]);
}

export const NULL_STR = '\\N'

type SupportedTypes = string|number|bigint|Buffer|null|boolean|Date

function escape(obj: SupportedTypes): string {
    if(obj === null) {
        return NULL_STR
    }
    if(Buffer.isBuffer(obj)) {
        return base64(obj)
    }
    if(obj === true) {
        return '1'
    }
    if(obj === false) {
        return '0'
    }
    if(typeof obj === 'number' || typeof obj === 'bigint') {
        return String(obj)
    }
    if(typeof obj === 'string') {
        if(obj === NULL_STR) {
            throw new Error("Ambiguous null string found")
        }
        if(/[",]/.test(obj)) {
            return '"' + obj.replace(/"/g,'""') + '"'
        }
        return obj;
    }
    if(obj instanceof Date) {
        return obj.toISOString().replace('T',' ').replace(/(?:\.000)?Z$/, '')
    }
    throw new Error("Cannot escape "+obj)
}
