import { expect, test } from 'bun:test'
import { createColors } from './color'

test('rgb formats foreground colors', () => {
    const pc = createColors(true)

    expect(pc.rgb(12, 34, 56)('text')).toBe('\x1b[38;2;12;34;56mtext\x1b[39m')
})

test('bgRgb formats background colors', () => {
    const pc = createColors(true)

    expect(pc.bgRgb(12, 34, 56)('text')).toBe('\x1b[48;2;12;34;56mtext\x1b[49m')
})

test('hex formats foreground colors', () => {
    const pc = createColors(true)

    expect(pc.hex('#0c2238')('text')).toBe('\x1b[38;2;12;34;56mtext\x1b[39m')
    expect(pc.hex('cde')('text')).toBe('\x1b[38;2;204;221;238mtext\x1b[39m')
})

test('bgHex formats background colors', () => {
    const pc = createColors(true)

    expect(pc.bgHex('#0c2238')('text')).toBe('\x1b[48;2;12;34;56mtext\x1b[49m')
})

test('24-bit color helpers return plain strings when colors are disabled', () => {
    const pc = createColors(false)

    expect(pc.rgb(12, 34, 56)('text')).toBe('text')
    expect(pc.bgHex('#0c2238')('text')).toBe('text')
})

test('rgb channels must be integers from 0 to 255', () => {
    const pc = createColors(true)

    expect(() => pc.rgb(-1, 0, 0)).toThrow(RangeError)
    expect(() => pc.bgRgb(0, 0, 256)).toThrow(RangeError)
    expect(() => pc.rgb(0, 1.5, 0)).toThrow(RangeError)
})

test('hex colors must be 3 or 6 hexadecimal digits', () => {
    const pc = createColors(true)

    expect(() => pc.hex('#12')).toThrow(TypeError)
    expect(() => pc.bgHex('#xyz')).toThrow(TypeError)
})
