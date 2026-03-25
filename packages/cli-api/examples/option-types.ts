#!/usr/bin/env bun
import {App, OptType} from '../src'
import * as pkg from '../package.json'

const app = new App('option-types')
    .meta({
        version: pkg.version,
        bin: 'option-types',
        author: 'Mark Penner',
        description: 'Example app showcasing every built-in OptType.',
    })
    .opt('text', {
        type: OptType.STRING,
        description: 'String value',
    })
    .opt('enabled', {
        type: OptType.BOOL,
        description: 'Boolean value',
        valueNotRequired: true,
    })
    .opt('count', {
        type: OptType.INT,
        description: 'Integer value',
    })
    .opt('ratio', {
        type: OptType.FLOAT,
        description: 'Floating-point value',
    })
    .opt('mode', {
        type: OptType.ENUM,
        enumValues: ['fast', 'slow'],
        description: 'Enumerated value',
    })
    .opt('input-file', {
        type: OptType.INPUT_FILE,
        description: 'Readable input file',
    })
    .opt('input-dir', {
        type: OptType.INPUT_DIRECTORY,
        description: 'Readable input directory',
    })
    .opt('output-file', {
        type: OptType.OUTPUT_FILE,
        description: 'Writable output file',
    })
    .opt('output-dir', {
        type: OptType.OUTPUT_DIRECTORY,
        description: 'Writable output directory',
    })
    .opt('scratch-dir', {
        type: OptType.EMPTY_DIRECTORY,
        description: 'Empty or non-existent directory',
    })
    .run(opts => {
        console.log({opts})
    })

if(import.meta.main) {
    await app.execute()
}
