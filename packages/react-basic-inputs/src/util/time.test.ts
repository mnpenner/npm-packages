import {describe, it, expect} from 'bun:test'
import type {IsoDateOptions} from './time.ts';
import { toIsoDateString} from './time.ts'

describe(toIsoDateString.name, () => {
    process.env.TZ = "America/Los_Angeles"
    it('default options', () => {
        expect(toIsoDateString('2024-09-01T18:28')).toBe('2024-09-01T18:28')
        expect(toIsoDateString('2024-09-01T18:28:29')).toBe('2024-09-01T18:28:29')
        expect(toIsoDateString('2024-09-01T18:28:29.1')).toBe('2024-09-01T18:28:29.100')
        expect(toIsoDateString('2024-09-01T18:28:29.01')).toBe('2024-09-01T18:28:29.010')
        expect(toIsoDateString('2024-09-01T18:28:29.001')).toBe('2024-09-01T18:28:29.001')
        expect(toIsoDateString('2024-09-01T18:28:00.001')).toBe('2024-09-01T18:28:00.001')  // no sec, has ms
        expect(toIsoDateString('2024-09-01T18:28:00.001',{milliseconds:false})).toBe('2024-09-01T18:28')  // hide both
        expect(toIsoDateString('2024-09-01T18:28:29.001Z')).toBe('2024-09-01T11:28:29.001')  // converts to local TZ
        expect(toIsoDateString(1725215281234)).toBe('2024-09-01T11:28:01.234')
        expect(toIsoDateString(new Date(1999, 1, 2, 3, 4, 5, 6))).toBe('1999-02-02T03:04:05.006')
    })

    it('with offset', () => {
        const opts: IsoDateOptions = {offset: true}
        expect(toIsoDateString('2024-09-01T18:28', opts)).toBe('2024-09-01T18:28-07:00')
        expect(toIsoDateString('2024-09-01T18:28:29', opts)).toBe('2024-09-01T18:28:29-07:00')
        expect(toIsoDateString('2024-09-01T18:28:29.1', opts)).toBe('2024-09-01T18:28:29.100-07:00')
        expect(toIsoDateString('2024-09-01T18:28:29.01', opts)).toBe('2024-09-01T18:28:29.010-07:00')
        expect(toIsoDateString('2024-09-01T18:28:29.001', opts)).toBe('2024-09-01T18:28:29.001-07:00')
        expect(toIsoDateString('2024-09-01T18:28:29.001Z', opts)).toBe('2024-09-01T11:28:29.001-07:00')  // converts to
                                                                                                         // local TZ
        expect(toIsoDateString(1725215281234, opts)).toBe('2024-09-01T11:28:01.234-07:00')
        expect(toIsoDateString(new Date(1999, 1, 2, 3, 4, 5, 6), opts)).toBe('1999-02-02T03:04:05.006-08:00')
    })

    it('no ms', () => {
        const opts: IsoDateOptions = {milliseconds: false, seconds: true}
        expect(toIsoDateString('2024-09-01T18:28', opts)).toBe('2024-09-01T18:28:00')
        expect(toIsoDateString('2024-09-01T18:28:29', opts)).toBe('2024-09-01T18:28:29')
        expect(toIsoDateString('2024-09-01T18:28:29.1', opts)).toBe('2024-09-01T18:28:29')
        expect(toIsoDateString('2024-09-01T18:28:29.01', opts)).toBe('2024-09-01T18:28:29')
        expect(toIsoDateString('2024-09-01T18:28:29.001', opts)).toBe('2024-09-01T18:28:29')
        expect(toIsoDateString('2024-09-01T18:28:29.001Z', opts)).toBe('2024-09-01T11:28:29')  // converts to local TZ
        expect(toIsoDateString(1725215281234, opts)).toBe('2024-09-01T11:28:01')
        expect(toIsoDateString(new Date(1999, 1, 2, 3, 4, 5, 6), opts)).toBe('1999-02-02T03:04:05')
    })
})
