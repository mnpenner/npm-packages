make a little lib in scripts/lib that reads all the packages/*/package.json files and maps the package name to the dirname

then update scripts/typecheck.ts, scripts/publish.ts, scripts/fix.ts to accept either a dir name or a package name. package name should take precedence

also all scripts should use chalk instead of custom ansi escape sequences
