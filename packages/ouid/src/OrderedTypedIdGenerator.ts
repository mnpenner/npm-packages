import {randomBytes} from 'node:crypto'
import assert from 'node:assert/strict'

/** Default epoch set to 2025-01-01T00:00:00Z in nanoseconds since Unix epoch. */
const DEFAULT_EPOCH = 1735689600_000_000_000n
/** Default scale factor, where each time unit in the ID represents 50 nanoseconds. */
const DEFAULT_SCALE_FACTOR = 50n  // 2^56*50ns = 114 years

/** Type definition for a high-resolution time function returning nanoseconds as a bigint. */
type HrTimeFn = () => bigint;

/**
 * Determines the best available high-resolution time function.
 * Prefers `process.hrtime.bigint` (Node.js), then `Bun.nanoseconds` (Bun),
 * falling back to `performance.now` (browser-compatible).
 */
const performanceNow: HrTimeFn = (() => {
    if(typeof process !== 'undefined' && typeof process.hrtime?.bigint === 'function') {
        return process.hrtime.bigint
    }
    if(typeof Bun !== 'undefined' && typeof Bun.nanoseconds === 'function') {
        // Note: Precision may degrade after 14.8 weeks of uptime in Bun.
        return () => BigInt(Bun.nanoseconds())
    }
    return () => BigInt(Math.floor(performance.now() * 1e6))
})()

/**
 * A 16-byte ID generator that produces monotonically increasing IDs based on time.
 * The ID includes:
 * - **56 bits** of scaled time since the epoch (bytes 0-6),
 * - **12 bits** of type tag for validation (bottom 4 bits of byte 14 + byte 15),
 * - **60 bits** of randomness for uniqueness (bytes 7-13 + top 4 bits of byte 14).
 *
 * This design ensures uniqueness even with parallel generation and allows ordering
 * based on the time component. The default epoch is 2025-01-01, and the default
 * time scale factor is 50 nanoseconds per unit, providing approximately 114 years
 * of time range from the epoch (until ~2139).
 *
 * ### Example Usage
 * ```typescript
 * enum MyType {
 *     TypeA = 0,
 *     TypeB = 1,
 * }
 * const generator = new OrderedTypedIdGenerator<MyType>();
 * const id = generator.generate(MyType.TypeA);
 * console.log(id); // 16-byte Buffer
 * const type = generator.extractType(id);
 * console.log(type === MyType.TypeA); // true
 * const date = generator.extractDate(id);
 * console.log(date); // Date object
 * ```
 */
export class OrderedTypedIdGenerator<IdType extends number> {
    /** Start time offset in nanoseconds, calculated at instantiation. */
    private readonly startTime: bigint
    /** Last recorded time unit, used to enforce monotonicity. */
    private lastTime: bigint | undefined

    /**
     * Creates a new ID generator instance.
     * @param epoch - The epoch time in nanoseconds since Unix epoch (1970-01-01T00:00:00Z).
     *                Defaults to 2025-01-01T00:00:00Z (1735689600_000_000_000n).
     * @param scaleFactor - The time scale factor; each unit in the ID represents this many nanoseconds.
     *                      Defaults to 50n. Must be positive.
     * @throws {AssertionError} If `epoch` is negative or `scaleFactor` is not positive.
     */
    constructor(
        private readonly epoch = DEFAULT_EPOCH,
        private readonly scaleFactor = DEFAULT_SCALE_FACTOR
    ) {
        assert(typeof epoch === 'bigint' && epoch >= 0n, 'epoch must be a non-negative bigint')
        assert(
            typeof scaleFactor === 'bigint' && scaleFactor > 0n,
            'scaleFactor must be a positive bigint'
        )
        const [dateNow, perfNow] = [Date.now(), performanceNow()]
        this.startTime = BigInt(dateNow) * 1_000_000n - this.epoch - perfNow
    }

    /**
     * Generates a new 16-byte ID with the specified type.
     * The ID is composed of 56 bits of time, 60 bits of randomness, and a 12-bit type tag.
     * @param type - The type tag, an integer between 0 and 4095 (12 bits). Can be a number
     *               or enum value convertible to such an integer.
     * @returns A 16-byte Buffer representing the ID.
     * @throws {AssertionError} If `type` is not in [0, 4095] or if time does not increase.
     */
    generate(type: IdType): Buffer {
        const typeNum = Number(type)
        assert(
            typeNum >= 0 && typeNum <= 0xFFF,
            `type must be in [0, ${0xFFF}], got ${typeNum}`
        )

        let time = (this.startTime + performanceNow()) / this.scaleFactor  // bigint will floor
        if (this.lastTime != null && time <= this.lastTime) {
            console.error('Current time was not greater than last time. Possible degradation in performance counter or insufficient scale factor.')
            time = this.lastTime + 1n;     // bump by one time unit
        }
        // assert(
        //     this.lastTime == null || time > this.lastTime,
        //     'Current time was not greater than last time. Possible degradation in performance counter or insufficient scale factor.'
        // )
        this.lastTime = time

        // Generate 60 bits (7.5 bytes) of randomness
        const random = randomBytes(8) // 8 bytes, using 60 bits

        // Create 16-byte buffer (128 bits)
        const buffer = Buffer.alloc(16)

        // 56 bits of time (bytes 0-6)
        buffer[0] = Number((time >> 48n) & 0xFFn)
        buffer[1] = Number((time >> 40n) & 0xFFn)
        buffer[2] = Number((time >> 32n) & 0xFFn)
        buffer[3] = Number((time >> 24n) & 0xFFn)
        buffer[4] = Number((time >> 16n) & 0xFFn)
        buffer[5] = Number((time >> 8n) & 0xFFn)
        buffer[6] = Number(time & 0xFFn)

        // 60 bits of randomness (bytes 7-13 + top 4 bits of byte 14)
        buffer[7] = random[0]
        buffer[8] = random[1]
        buffer[9] = random[2]
        buffer[10] = random[3]
        buffer[11] = random[4]
        buffer[12] = random[5]
        buffer[13] = random[6]
        buffer[14] = (random[7] & 0xF0) | ((typeNum >> 8) & 0x0F) // Top 4 random + top 4 type

        // 12 bits of type (bottom 4 bits of byte 14 + byte 15)
        buffer[15] = typeNum & 0xFF // Bottom 8 bits of type

        return buffer
    }

    /**
     * Extracts the type tag from a given ID.
     * @param id - The 16-byte ID from which to extract the type.
     * @returns The type tag as an `IdType` value (integer 0-4095).
     * @throws {AssertionError} If `id` is not exactly 16 bytes.
     */
    extractType(id: Buffer): IdType {
        assert(id.length === 16, 'ID must be 16 bytes long')

        const typeHigh = id[14] & 0x0F // Bottom 4 bits of byte 14
        const typeLow = id[15] // All 8 bits of byte 15
        return ((typeHigh << 8) | typeLow) as IdType
    }

    /**
     * Extracts the time from a given ID in nanoseconds since the Unix epoch.
     * The returned time is approximate, with accuracy limited to the scale factor
     * (e.g., 50 ns by default).
     * @param id - The 16-byte ID from which to extract the time.
     * @returns Nanoseconds since 1970-01-01T00:00:00Z as a bigint.
     * @throws {AssertionError} If `id` is not exactly 16 bytes.
     */
    extractTimeNs(id: Buffer): bigint {
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

        return time * this.scaleFactor + this.epoch
    }

    /**
     * Extracts the time from a given ID in milliseconds since the Unix epoch.
     * The returned time is approximate due to scaling and conversion.
     * @param id - The 16-byte ID from which to extract the time.
     * @returns Milliseconds since 1970-01-01T00:00:00Z as a number.
     * @throws {AssertionError} If `id` is not exactly 16 bytes.
     */
    extractTimeMs(id: Buffer): number {
        return Number(this.extractTimeNs(id) / 1_000_000n)
    }

    /**
     * Extracts the time from a given ID as a Date object.
     * The returned time is approximate due to scaling and conversion.
     * @param id - The 16-byte ID from which to extract the time.
     * @returns A Date object representing the time the ID was generated.
     * @throws {AssertionError} If `id` is not exactly 16 bytes.
     */
    extractDate(id: Buffer): Date {
        return new Date(this.extractTimeMs(id))
    }
}
