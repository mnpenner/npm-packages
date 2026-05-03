import type { URL } from 'node:url'
import * as FileSystem from 'node:fs'
import * as Path from 'node:path'
import { flatten } from '../Arr'
import { promisify } from '../Lang/promise'
import { filterAsync } from '../Col'
import type { Stats } from 'node:fs'
import type { JsonValue } from '../interfaces'

export interface ReadOptions {
    encoding?: string | null
    flag?: string
}

export interface WriteOptions {
    encoding?: string | null
    mode?: number
    flag?: string
}

export type FileDescriptor = number

/**
 * Reads a file.
 * @param path - Path to file.
 * @param options - Read options.
 * @returns Promise resolving to file content.
 */
export const readFile: <T extends Buffer | string = Buffer>(
    path: string | Buffer | URL | FileDescriptor,
    options?: ReadOptions | string,
) => Promise<T> = promisify(FileSystem.readFile)

/**
 * Writes a file.
 * @param file - Path to file.
 * @param data - Data to write.
 * @param options - Write options.
 * @returns Promise resolving when done.
 */
export const writeFile: (
    file: string | Buffer | FileDescriptor,
    data: string | Buffer | Uint8Array,
    options?: WriteOptions | string,
) => Promise<void> = promisify<void>(FileSystem.writeFile)

/**
 * Reads a file as text.
 * @param file - Path to file.
 * @returns Promise resolving to string content.
 */
export const readText = (file: string) => readFile<string>(file, { encoding: 'utf8' })

/**
 * Reads a file as JSON.
 * @param file - Path to file.
 * @returns Promise resolving to parsed JSON.
 */
export const readJson: (file: string) => Promise<JsonValue> = (file) =>
    readText(file).then((x) => JSON.parse(x))

const readdirAsync = promisify<string[]>(FileSystem.readdir)
/**
 * Reads a directory.
 * @param path - Path to directory.
 * @returns Promise resolving to list of full paths.
 */
export const readDir = (path: string) =>
    readdirAsync(path).then((entries) => entries.map((e) => Path.join(path, e)))

/**
 * Gets file stats.
 * @param path - Path to file.
 * @returns Promise resolving to Stats.
 */
export const fileStat: (path: string | Buffer | URL) => Promise<Stats> = promisify<Stats>(
    FileSystem.stat,
)

const accessAsync = promisify<void>(FileSystem.access)
/**
 * Checks file access.
 * @param path - Path to file.
 * @param mode - Access mode.
 * @returns Promise resolving to boolean.
 */
export const fileAccess = (path: string | Buffer | URL, mode: number) =>
    accessAsync(path, mode).then(
        () => true,
        (err) => {
            // if file does not exist or permission is denied, return false, otherwise throw
            if (err.code === 'ENOENT' || err.code === 'EACCES') {
                return false
            }
            throw err
        },
    )

/**
 * Checks if a file exists.
 * @param file - Path to file.
 * @returns Promise resolving to boolean.
 */
export const fileExists = (file: string | Buffer | URL) =>
    fileAccess(file, FileSystem.constants.F_OK)

/**
 * Deletes a file.
 * @param path - Path to file.
 * @returns Promise resolving when done.
 */
export const deleteFile: (path: string | Buffer | URL) => Promise<void> = promisify<void>(
    FileSystem.unlink,
)

/**
 * Gets files in a directory.
 * @param dir - Path to directory.
 * @param recursive - Whether to recurse.
 * @returns Promise resolving to list of files.
 */
export function getFiles(dir: string, recursive = true): Promise<string[]> {
    return readDir(dir).then((paths) => {
        if (recursive) {
            return Promise.all(
                paths.map((path) =>
                    fileStat(path).then((stat) =>
                        stat.isDirectory() ? getFiles(path, recursive) : [path],
                    ),
                ),
            ).then(flatten)
        }

        return filterAsync(paths, (p) => fileStat(p).then((s) => s.isFile()))
    })
}
