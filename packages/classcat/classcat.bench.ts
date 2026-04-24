#!bun
import {bench, group, run, summary} from 'mitata'
import {cc} from './classcat'

const simpleStrings = ['btn', 'btn-primary', 'is-active']
const arrayInput = ['btn', false, null, undefined, 0, 'btn-primary', true, 'is-active']
const objectInput = {
    btn: true,
    'btn-primary': true,
    'is-disabled': false,
    'is-loading': 0,
    'is-active': 1,
}
const nestedInput = [
    'btn',
    ['btn-primary', [false, 'is-active', {'has-icon': true, 'is-disabled': false}]],
    {'size-lg': true},
]

summary(() => {
    group('classcat', () => {
        bench('strings', () => {
            cc(...simpleStrings)
        })

        bench('array', () => {
            cc(arrayInput)
        })

        bench('object', () => {
            cc(objectInput)
        })

        bench('nested', () => {
            cc(nestedInput)
        })

        bench('mixed arguments', () => {
            cc('btn', ['btn-primary', {'has-icon': true}], objectInput, 0, false, null)
        })
    })
})

await run()
