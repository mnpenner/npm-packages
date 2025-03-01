import {randomBytes} from 'node:crypto'
import assert from 'node:assert/strict'


const DEFAULT_EPOCH = 1735689600_000_000_000n // 2025-01-01T00:00:00Z
const DEFAULT_SCALE_FACTOR = 50n

type HrTimeFn = () => bigint

const performanceNow = ((): HrTimeFn => {
    if(typeof process !== 'undefined' && typeof process.hrtime?.bigint === 'function') {
        return process.hrtime.bigint
    }
    if(typeof Bun !== 'undefined' && typeof Bun.nanoseconds === 'function') {
        // WARNING: The precision of the returned value will degrade after 14.8 weeks of uptime
        return () => BigInt(Bun.nanoseconds())
    }
    return () => BigInt(Math.round(performance.now() * 1e6))
})()

// console.log(performanceNow() - performanceNow())

export class TypedIdGenerator<IdType> {
    private startTime!: bigint
    private lastTime: bigint | undefined

    constructor(private readonly epoch = DEFAULT_EPOCH, private readonly scaleFactor = DEFAULT_SCALE_FACTOR) {
        this._init()
    }

    private _init() {
        const [dateNow, perfNow] = [Date.now(), performanceNow()]
        this.startTime = BigInt(dateNow) * 1_000_000n - this.epoch - perfNow
    }

    generate(type: IdType): Uint8Array {
        const typeNum = Number(type)
        assert(typeNum >= 0 && typeNum <= 0xFFF)
        // console.log(typeNum)

        let time = (this.startTime + performanceNow()) / this.scaleFactor
        // https://www.wolframalpha.com/input?i=+2025-01-01+00%3A00%3A00+UTC+%2B+51059181371154+*+100ns
        if(this.lastTime != null && time < this.lastTime) {
            // This should never happen, but this will force monotonicity regardless.
            time = this.lastTime + 1n
            this._init()
        }
        this.lastTime = time
        // 56 bits of time buys us 228 years; https://www.wolframalpha.com/input?i=2%5E56*100ns

        // Generate 60 bits (7.5 bytes) of randomness
        const random = randomBytes(8) // Get 8 bytes, we'll use 60 bits

        // Create 16-byte buffer (128 bits)
        const buffer = new Uint8Array(16)

        // 56 bits of time (bytes 0-6)
        buffer[0] = Number((time >> 48n) & 0xFFn)
        buffer[1] = Number((time >> 40n) & 0xFFn)
        buffer[2] = Number((time >> 32n) & 0xFFn)
        buffer[3] = Number((time >> 24n) & 0xFFn)
        buffer[4] = Number((time >> 16n) & 0xFFn)
        buffer[5] = Number((time >> 8n) & 0xFFn)
        buffer[6] = Number(time & 0xFFn)

        // 60 bits of random (bytes 7-13 + top 4 bits of byte 14)
        buffer[7] = random[0]
        buffer[8] = random[1]
        buffer[9] = random[2]
        buffer[10] = random[3]
        buffer[11] = random[4]
        buffer[12] = random[5]
        buffer[13] = random[6]
        buffer[14] = (random[7] & 0xF0) | ((typeNum >> 8) & 0x0F) // Top 4 bits random + top 4 bits type

        // 12 bits of type (bottom 4 bits of byte 14 + byte 15)
        buffer[15] = typeNum & 0xFF // Bottom 8 bits of type

        return buffer
    }

    /**
     * Extracts the type tag from an ID.
     */
    extractType(id: Uint8Array): IdType {
        assert(id.length === 16, 'ID must be 16 bytes long')

        // Extract type: bottom 4 bits of byte 14 + all 8 bits of byte 15
        const typeHigh = id[14] & 0x0F // Bottom 4 bits of byte 14
        const typeLow = id[15]         // All 8 bits of byte 15
        return ((typeHigh << 8) | typeLow) as IdType
    }

    /**
     * Extracts the time portion of ID.
     * @returns nanoseconds since unix epoch (1970-01-01 00:00:00 UTC)
     */
    extractTimeNs(id: Uint8Array): bigint {
        assert(id.length === 16, 'ID must be 16 bytes long')

        // Reconstruct 56-bit time from bytes 0-6
        const time =
            (BigInt(id[0]) << 48n) |
            (BigInt(id[1]) << 40n) |
            (BigInt(id[2]) << 32n) |
            (BigInt(id[3]) << 24n) |
            (BigInt(id[4]) << 16n) |
            (BigInt(id[5]) << 8n) |
            BigInt(id[6])

        // Convert back to nanoseconds since epoch
        return time * this.scaleFactor + this.epoch
    }

    extractTimeMs(id: Uint8Array): number {
        return Number(this.extractTimeNs(id)/1_000_000n)
    }

    extractDate(id: Uint8Array): Date {
        return new Date(this.extractTimeMs(id))
    }
}
