#!/usr/bin/env bash
set -xeufo pipefail

npm version "${1:-patch}"
./clean.sh
./build.sh
cd dist
npm publish
