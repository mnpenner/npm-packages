#!/usr/bin/env bash
set -xeufo pipefail

npx esbuild --bundle src/index.ts --outdir=dist --platform=node --target=node14
jq 'del(.devDependencies,.private,.scripts)' package.json > dist/package.json
cp README.md dist/
