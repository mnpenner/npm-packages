#!/usr/bin/env -S bun -i
import {parseArgs, type ParseArgsConfig} from "node:util"
import {$} from 'bun'
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";

const PARSE_CONFIG = {
    options: {
        coverage: {
            type: 'boolean',
        },
    },
    strict: false,
    allowPositionals: true,
} satisfies ParseArgsConfig

/**
 * Run tests for all packages and display a summary of passes/failures/skips.
 */
async function main(options: Options, _positionals: Positionals): Promise<number | void> {
    const packagesDir = "packages";
    const packageDirs = (await readdir(packagesDir, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();

    const rawArgs = process.argv.slice(2);
    
    // Simple package filtering: if any arg matches a package dir name exactly, only test those.
    let targetPackages = packageDirs;
    const filterArgs = rawArgs.filter(arg => packageDirs.includes(arg));
    if (filterArgs.length > 0) {
        targetPackages = filterArgs;
    }
    
    // Pass other args (flags like -t, --watch, etc.) to bun test
    const bunTestArgs = rawArgs.filter(arg => !packageDirs.includes(arg));

    console.log(chalk.bold(`Running tests for ${targetPackages.length} packages...\n`));

    const results: Array<{
        pkg: string;
        status: 'pass' | 'fail' | 'skip' | 'none';
        passCount: number;
        failCount: number;
        skipCount: number;
        output: string;
    }> = [];

    // Run tests for each package in parallel with a concurrency limit
    const CONCURRENCY = 8;
    const queue = [...targetPackages];
    
    async function runNext(): Promise<void> {
        if (queue.length === 0) return;
        const pkg = queue.shift()!;
        const pkgPath = join(packagesDir, pkg);
        
        try {
            // FORCE_COLOR=1 ensures we get colored output for parsing and display
            // --pass-with-no-tests ensures we don't get an exit code 1 just because a package has no tests
            const result = await $`bun test --pass-with-no-tests ${bunTestArgs}`
                .cwd(pkgPath)
                .env({ ...process.env, FORCE_COLOR: "1" })
                .nothrow()
                .quiet();
            
            const output = result.stdout.toString() + result.stderr.toString();
            const exitCode = result.exitCode;
            
            let passCount = 0;
            let failCount = 0;
            let skipCount = 0;
            let coverage: number | null = null;
            
            // Bun summary matches: "930 pass", "23 skip", "1 fail"
            const passMatch = output.match(/(\d+) pass/);
            const skipMatch = output.match(/(\d+) skip/);
            const failMatch = output.match(/(\d+) fail/);
            
            if (passMatch) passCount = parseInt(passMatch[1], 10);
            if (skipMatch) skipCount = parseInt(skipMatch[1], 10);
            if (failMatch) failCount = parseInt(failMatch[1], 10);

            if (options.coverage) {
                // Strip ANSI codes for easier parsing
                const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');
                // Look for "All files                         |   XX.XX |   YY.YY |"
                // The second column is usually line coverage
                const covMatch = cleanOutput.match(/All files\s+\|\s+[\d.]+\s+\|\s+([\d.]+)\s+\|/);
                if (covMatch) {
                    coverage = parseFloat(covMatch[1]);
                }
            }

            let status: 'pass' | 'fail' | 'skip' | 'none';
            if (exitCode !== 0 || failCount > 0) {
                status = 'fail';
            } else if (passCount > 0) {
                status = 'pass';
            } else if (skipCount > 0) {
                status = 'skip';
            } else {
                status = 'none';
            }
            
            results.push({ pkg, status, passCount, failCount, skipCount, output });
            
            const TICK = chalk.green('✓');
            const CROSS = chalk.red('✗');
            const SKIP = chalk.yellow('»');
            const NONE = chalk.gray('∅');
            
            const icon = status === 'pass' ? TICK : 
                         status === 'fail' ? CROSS : 
                         status === 'skip' ? SKIP : NONE;

            const stats = [];
            if (passCount > 0) stats.push(chalk.green(`${passCount} pass`));
            if (failCount > 0) stats.push(chalk.red(`${failCount} fail`));
            if (skipCount > 0) stats.push(chalk.yellow(`${skipCount} skip`));
            
            if (coverage !== null) {
                const covStr = `${coverage.toFixed(0)}% cov`;
                if (coverage === 100) stats.push(chalk.green.underline(covStr));
                else if (coverage >= 90) stats.push(chalk.green(covStr));
                else if (coverage >= 76) stats.push(chalk.cyan(covStr));
                else if (coverage >= 50) stats.push(chalk.yellow(covStr));
                else stats.push(chalk.red(covStr));
            }
            
            const statsStr = stats.length > 0 ? ` (${stats.join(', ')})` : '';
            console.log(`${icon} ${pkg}${statsStr}`);
            
            if (status === 'fail') {
                const lines = output.split('\n');
                // Capture the specific failing tests from the output
                const failingTests = lines
                    .filter(line => {
                        const l = line.trim();
                        return (l.includes('✗') || l.includes('(fail)')) && 
                               !l.includes('tests failed:') && 
                               !l.includes('Ran ') &&
                               !l.match(/^\d+ fail/);
                    })
                    .map(line => {
                        let l = line.trim();
                        l = l.replace(/^\(fail\)\s+/, '✗ ');
                        return l;
                    });
                
                if (failingTests.length > 0) {
                    const uniqueFailing = Array.from(new Set(failingTests));
                    for (const fail of uniqueFailing.slice(0, 5)) {
                        console.log(`  ${fail}`);
                    }
                    if (uniqueFailing.length > 5) {
                        console.log(chalk.gray(`  ... and ${uniqueFailing.length - 5} more failing tests`));
                    }
                } else if (exitCode !== 0) {
                    const errorLines = lines.filter(l => l.toLowerCase().includes('error:') || l.includes('EPIPE'));
                    if (errorLines.length > 0) {
                        for (const err of errorLines.slice(0, 3)) {
                            console.log(chalk.red(`  ! ${err.trim()}`));
                        }
                    } else {
                        const lastLines = lines.filter(l => l.trim()).slice(-3);
                        for (const line of lastLines) {
                            console.log(chalk.gray(`  ${line.trim()}`));
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`${chalk.red('✗')} ${pkg} (Error: ${String(e).split('\n')[0]})`);
            results.push({ pkg, status: 'fail', passCount: 0, failCount: 1, skipCount: 0, output: String(e) });
        }

        return runNext();
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, targetPackages.length) }, () => runNext());
    await Promise.all(workers);

    // Final summary
    console.log(chalk.bold(`\nSummary:`));
    const totalPass = results.filter(r => r.status === 'pass').length;
    const totalFail = results.filter(r => r.status === 'fail').length;
    const totalSkip = results.filter(r => r.status === 'skip').length;
    const totalNone = results.filter(r => r.status === 'none').length;
    
    if (totalPass > 0) console.log(chalk.green(`  ✓ ${totalPass} packages passed`));
    if (totalFail > 0) console.log(chalk.red(`  ✗ ${totalFail} packages failed`));
    if (totalSkip > 0) console.log(chalk.yellow(`  » ${totalSkip} packages skipped`));
    if (totalNone > 0) console.log(chalk.gray(`  ∅ ${totalNone} packages with no tests`));

    if (totalFail > 0) {
        return 1;
    }
}

//#region Invoke main
type ParsedConfig = ReturnType<typeof parseArgs<typeof PARSE_CONFIG>>
type Options = ParsedConfig["values"]
type Positionals = ParsedConfig["positionals"]

if(import.meta.main) {
    const {values, positionals} = parseArgs(PARSE_CONFIG)

    main(values, positionals).then(
        (exitCode) => {
            if(typeof exitCode === "number") {
                process.exitCode = exitCode
            }
        },
        (err) => {
            if(err instanceof $.ShellError) {
                console.error(`Command failed with exit code ${err.exitCode}`)
                process.exitCode = err.exitCode
            } else {
                console.error(err ?? 'An unknown error occurred')
                process.exitCode = 1
            }
        },
    )
}
//#endregion
