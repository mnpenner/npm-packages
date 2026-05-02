#!/usr/bin/env bun
import { $ } from "bun";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

/**
 * Run tests for all packages and display a summary of passes/failures/skips.
 */
async function main() {
    const packagesDir = "packages";
    const packageDirs = (await readdir(packagesDir, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .sort();

    const args = process.argv.slice(2);
    
    // Simple package filtering: if any arg matches a package dir name exactly, only test those.
    let targetPackages = packageDirs;
    const filterArgs = args.filter(arg => packageDirs.includes(arg));
    if (filterArgs.length > 0) {
        targetPackages = filterArgs;
    }
    
    // Pass other args (flags like -t, --watch, etc.) to bun test
    const bunTestArgs = args.filter(arg => !packageDirs.includes(arg));

    process.stdout.write(`\x1b[1mRunning tests for ${targetPackages.length} packages...\x1b[0m\n\n`);

    const results: Array<{
        pkg: string;
        status: 'pass' | 'fail' | 'skip';
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
            
            // Bun summary matches: "930 pass", "23 skip", "1 fail"
            const passMatch = output.match(/(\d+) pass/);
            const skipMatch = output.match(/(\d+) skip/);
            const failMatch = output.match(/(\d+) fail/);
            
            if (passMatch) passCount = parseInt(passMatch[1], 10);
            if (skipMatch) skipCount = parseInt(skipMatch[1], 10);
            if (failMatch) failCount = parseInt(failMatch[1], 10);

            let status: 'pass' | 'fail' | 'skip';
            if (exitCode !== 0 || failCount > 0) {
                status = 'fail';
            } else if (passCount > 0) {
                status = 'pass';
            } else {
                // If there are only skipped tests, or no tests at all, it's a 'skip'
                status = 'skip';
            }
            
            results.push({ pkg, status, passCount, failCount, skipCount, output });
            
            const TICK = '\x1b[32m✓\x1b[0m';
            const CROSS = '\x1b[31m✗\x1b[0m';
            const SKIP = '\x1b[33m»\x1b[0m';
            
            const icon = status === 'pass' ? TICK : status === 'fail' ? CROSS : SKIP;
            const stats = [];
            if (passCount > 0) stats.push(`\x1b[32m${passCount} pass\x1b[0m`);
            if (failCount > 0) stats.push(`\x1b[31m${failCount} fail\x1b[0m`);
            if (skipCount > 0) stats.push(`\x1b[33m${skipCount} skip\x1b[0m`);
            
            const statsStr = stats.length > 0 ? ` (${stats.join(', ')})` : '';
            console.log(`${icon} ${pkg}${statsStr}`);
            
            if (status === 'fail') {
                const lines = output.split('\n');
                // Capture the specific failing tests from the output
                // Support both icons and text-based (fail) markers
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
                        // Clean up formatting if it's (fail) test-name
                        l = l.replace(/^\(fail\)\s+/, '✗ ');
                        return l;
                    });
                
                if (failingTests.length > 0) {
                    const uniqueFailing = Array.from(new Set(failingTests));
                    for (const fail of uniqueFailing.slice(0, 5)) {
                        console.log(`  ${fail}`);
                    }
                    if (uniqueFailing.length > 5) {
                        console.log(`  \x1b[90m... and ${uniqueFailing.length - 5} more failing tests\x1b[0m`);
                    }
                } else if (exitCode !== 0) {
                    // Fallback for other types of errors (e.g. compilation errors)
                    const errorLines = lines.filter(l => l.toLowerCase().includes('error:') || l.includes('EPIPE'));
                    if (errorLines.length > 0) {
                        for (const err of errorLines.slice(0, 3)) {
                            console.log(`  \x1b[31m! ${err.trim()}\x1b[0m`);
                        }
                    } else {
                        // Just show last few non-empty lines
                        const lastLines = lines.filter(l => l.trim()).slice(-3);
                        for (const line of lastLines) {
                            console.log(`  \x1b[90m${line.trim()}\x1b[0m`);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`\x1b[31m✗\x1b[0m ${pkg} (Error: ${String(e).split('\n')[0]})`);
            results.push({ pkg, status: 'fail', passCount: 0, failCount: 1, skipCount: 0, output: String(e) });
        }

        return runNext();
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, targetPackages.length) }, () => runNext());
    await Promise.all(workers);

    // Final summary
    process.stdout.write(`\n\x1b[1mSummary:\x1b[0m\n`);
    const totalPass = results.filter(r => r.status === 'pass').length;
    const totalFail = results.filter(r => r.status === 'fail').length;
    const totalSkip = results.filter(r => r.status === 'skip').length;
    
    if (totalPass > 0) console.log(`  \x1b[32m✓ ${totalPass} packages passed\x1b[0m`);
    if (totalFail > 0) console.log(`  \x1b[31m✗ ${totalFail} packages failed\x1b[0m`);
    if (totalSkip > 0) console.log(`  \x1b[33m» ${totalSkip} packages skipped (or no tests)\x1b[0m`);

    if (totalFail > 0) {
        process.exit(1);
    }
}

if (import.meta.main) {
    main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
