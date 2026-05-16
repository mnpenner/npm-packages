import type { WriteStream, Logger} from '../logger';
import createColors from '@mpen/picocolors'

export class EmojiLogger implements Logger {
    private pc = createColors()

    constructor(private readonly stream: WriteStream = process.stdout) {}

    info(...data: any[]): void {
        this.stream.write('\u2139\uFE0F ' + data.map((x) => String(x)).join('  ') + '\n')
    }

    warn(...data: any[]): void {
        this.stream.write('\u{1F6A7} ' + data.map((x) => this.pc.yellow(x)).join('  ') + '\n')
    }

    error(...data: any[]): void {
        this.stream.write('\u274C ' + data.map((x) => this.pc.red(x)).join('  ') + '\n')
    }


    table(tabularData?: any, properties?: string[]): void {}
}

