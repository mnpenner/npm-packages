#!/usr/bin/env bash
set -xeufo pipefail

#install -m 0775 -d dist
mkdir -p dist
find dist -mindepth 1 -maxdepth 1 -exec rm -r -- {} +
pnpx tsc -p . || echo -e "\033[0;31mWARNING: tsc exited with status code $?\033[0m"
jq 'del(.devDependencies,.private,.scripts)' package.json > dist/package.json
cp README.md pnpm-lock.yaml schema.json dist/

tree -sh -L 3 dist

cd dist
test -f "$(jq -r .bin package.json)"
