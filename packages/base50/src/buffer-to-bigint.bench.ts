import {bench, run, group, summary, barplot, boxplot, lineplot} from 'mitata'
import {beBufToBigInt} from './buffer-to-bigint'
import {randomBytes, randomInt, getRandomValues} from 'crypto'


console.log("Starting benchmarks...\n")

const arrays: number[][] = []
const buffers: Buffer[] = []
const typedArrays: Uint8Array[] = []

for(let i = 0; i < 10000; ++i) {
    const len = randomInt(1, 9)
    const buf = randomBytes(len)
    buffers.push(buf)
    arrays.push(Array.from(buf))
    typedArrays.push(new Uint8Array(buf))
}

// console.log(buffers,arrays,typedArrays)

group('beBufToBigInt', () => {
    barplot(() => {
        summary(() => {
            bench('Array', () => {
                for(const arr of arrays) {
                    beBufToBigInt(arr)
                }
            })

            bench('Buffer', () => {
                for(const arr of buffers) {
                    beBufToBigInt(arr)
                }
            })

            bench('Uint8Array', () => {
                for(const arr of typedArrays) {
                    beBufToBigInt(arr)
                }
            })
        })
    })
})


await run({})

console.log("\nBenchmark run finished.")
