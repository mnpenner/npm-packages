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
    .options([
        {
            name: 'text',
            type: OptType.STRING,
            description: 'String value',
        },
        {
            name: 'enabled',
            type: OptType.BOOL,
            description: 'Boolean value',
        },
        {
            name: 'count',
            type: OptType.INT,
            description: 'Integer value',
        },
        {
            name: 'ratio',
            type: OptType.FLOAT,
            description: 'Floating-point value',
        },
        {
            name: 'mode',
            type: OptType.ENUM,
            enumValues: ['fast', 'slow'],
            description: 'Enumerated value',
        },
        {
            name: 'input-file',
            type: OptType.INPUT_FILE,
            description: 'Readable input file',
        },
        {
            name: 'input-dir',
            type: OptType.INPUT_DIRECTORY,
            description: 'Readable input directory',
        },
        {
            name: 'output-file',
            type: OptType.OUTPUT_FILE,
            description: 'Writable output file',
        },
        {
            name: 'output-dir',
            type: OptType.OUTPUT_DIRECTORY,
            description: 'Writable output directory',
        },
        {
            name: 'scratch-dir',
            type: OptType.EMPTY_DIRECTORY,
            description: 'Empty or non-existent directory',
        },
    ])
    .run(opts => {
        console.log({opts})
    })

if(import.meta.main) {
    await app.execute()
}


