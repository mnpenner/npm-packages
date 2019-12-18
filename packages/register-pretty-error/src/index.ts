import sms from 'source-map-support';
import Chalk from 'chalk';
import {codeFrameColumns} from '@babel/code-frame';
import fs from 'fs';
import Path from 'path';

sms.install({handleUncaughtExceptions: false});

// const AT_FUNC_FN = /^    at (?<func>.+?) \((?<file>.+?):(?<line>\d+):(?<col>\d+)\)$/mgs;
// const AT_FN = /^    at (?<file>.+?):(?<line>\d+):(?<col>\d+)$/ms;

process.on('uncaughtException', async err => {

    // console.log(String(err.stack).match(/^    at (.+):(\d+):(\d+)$/m))


    if (!err.stack) {
        console.error(`${Chalk.bgRed(' Error ')} ${Chalk.red(err)}`)
        return;
    }

    const errStr = String(err.stack);


    const match = errStr.match(/^    at (?:(?<func>.+?) \((?<file>.+?):(?<line>\d+):(?<col>\d+)\)|(?<file2>.+?):(?<line2>\d+):(?<col2>\d+))$/m);

    // console.log(match);

    if (!match) {
        console.error(`${Chalk.bgRed(' Error ')} ${Chalk.red(errStr)}`)
        return;
    }


    const topfilename = match.groups!.file ?? match.groups!.file2;

    const msg = errStr.slice(0, match.index! - 1);
    const stackStr = errStr.slice(match.index! + match[0]!.length + 1);

    const errorType = /(\S+):\s*(.+)/ms.exec(msg);

    console.log(Chalk.bgRed(` ${errorType?.[1] ?? "Error"} `) + Chalk.white(` ${Path.relative(process.cwd(), topfilename)}:${Chalk.blue(match.groups!.line ?? match.groups!.line2)}:${Chalk.cyan(match.groups!.col ?? match.groups!.col2)}`))
    // console.log(Chalk.white(Path.relative(process.cwd(), match[1])));

    if (topfilename) {
        const fileContents = await fs.promises.readFile(topfilename, {encoding: 'utf8'});


        const location = {
            start: {
                line: Number(match.groups!.line ?? match.groups!.line2),
                column: Number(match.groups!.col ?? match.groups!.col2)
            }
        };
        const codeHighlight = codeFrameColumns(fileContents, location, {
            highlightCode: true,
            message: err.message,
            linesAbove: 2,
            linesBelow: 3
        });

        console.log(codeHighlight);
    }


    const stackTrace = Array.from(stackStr.matchAll(/^    at (?:(?<func>.+?) \((?<file>.+?):(?<line>\d+):(?<col>\d+)\)|(?<file2>.+?):(?<line2>\d+):(?<col2>\d+))$/mg));
    let lineCount = stackTrace.length;
    const width = String(lineCount - 1).length;
    // lines.reverse();

    // console.log('lines',stack,lines);

    for (const frame of stackTrace) {
        let filename = frame.groups!.file ?? frame.groups!.file2;
        if (filename.startsWith('/')) {
            filename = Path.relative(process.cwd(), filename);
            if (filename.startsWith('node_modules/')) {
                filename = Chalk.grey(filename);
            }
        } else {
            filename = Chalk.grey(filename);
        }
        // console.log(line);
        console.log(`${Chalk.bold(`${String(--lineCount).padStart(width, ' ')}.`)} ${Chalk.underline(filename)}:${Chalk.blue(frame.groups!.line ?? frame.groups!.line2)}:${Chalk.cyan(frame.groups!.col ?? frame.groups!.col2)}${frame.groups!.func ? `  ${Chalk.yellow(frame.groups!.func)}` : ''}`)
    }

    // console.log(lines);

    // const [msg,stack] = String(err.stack).split(/\r?\n|\r/,1);
    //
    // console.log(msg,stack);

    // console.log(m);
    // console.log(String(err.stack));
    // console.log(util.inspect(err,{colors:true,showHidden:true}))

    // const data = parseError(err);
    //

});


// function main() {
//     throw "foo"
//
// }


// (() => {
//     main();
//
// })();
