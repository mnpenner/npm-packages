#!/usr/bin/env bash
set -xeufo pipefail

if [[ -z "$1" ]]; then
  >&2 echo "usage: ./publish.sh patch"
  exit 1
fi

npm version "$1"
./clean.sh
./build.sh
cd dist
npm publish
