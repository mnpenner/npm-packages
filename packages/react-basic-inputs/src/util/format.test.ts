import {describe, it, expect, test} from 'bun:test'
import {toDateInputValue} from './format.ts'

test(toDateInputValue.name, () => {
    process.env.TZ = "America/Los_Angeles";
    expect(toDateInputValue('2024-09-01T18:28')).toBe('2024-09-01T18:28')
    expect(toDateInputValue('2024-09-01T18:28:29')).toBe('2024-09-01T18:28:29')
    expect(toDateInputValue('2024-09-01T18:28:29.1')).toBe('2024-09-01T18:28:29.100')
    expect(toDateInputValue('2024-09-01T18:28:29.01')).toBe('2024-09-01T18:28:29.010')
    expect(toDateInputValue('2024-09-01T18:28:29.001')).toBe('2024-09-01T18:28:29.001')
    expect(toDateInputValue('2024-09-01T18:28:29.001Z')).toBe('2024-09-01T11:28:29.001')  // converts to local TZ
    expect(toDateInputValue(1725215281234)).toBe('2024-09-01T11:28:01.234')
    expect(toDateInputValue(new Date(1999,1,2,3,4,5,6))).toBe('1999-02-02T03:04:05.006')
})
