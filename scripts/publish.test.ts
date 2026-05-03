import { describe, expect, test } from 'bun:test'
import { getNextPublishVersion } from './publish-version'

describe('getNextPublishVersion', () => {
    test('uses a manually bumped package version when it is newer than the latest release', () => {
        expect(getNextPublishVersion('1.2.4', '1.2.3')).toBe('1.2.4')
    })

    test('patch-bumps the latest release when the package version matches it', () => {
        expect(getNextPublishVersion('1.2.3', '1.2.3')).toBe('1.2.4')
    })

    test('patch-bumps the latest release when the package version is behind it', () => {
        expect(getNextPublishVersion('1.2.2', '1.2.3')).toBe('1.2.4')
    })

    test('patch-bumps the latest release when the package version is missing', () => {
        expect(getNextPublishVersion(undefined, '1.2.3')).toBe('1.2.4')
    })
})
