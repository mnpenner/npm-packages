import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/** @internal */
export async function readDirDeep(dir: string): Promise<string[]> {
    const files = await readdir(dir)
    const nestedFiles = await Promise.all(
        files.map(async (file) => {
            const filePath = path.join(dir, file)
            const fileStat = await stat(filePath)
            return fileStat.isDirectory() ? readDirDeep(filePath) : filePath
        }),
    )

    return nestedFiles.flat()
}
