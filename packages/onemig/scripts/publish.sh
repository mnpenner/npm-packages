#!/usr/bin/env bash
set -xeufo pipefail

DIR="$(dirname "${BASH_SOURCE[0]}")"
yarn version
"$DIR/build.sh"
cd dist
pnpm publish --ignore-scripts
sleep 5  # wait for npm registry to pick up new version
pnpx onemig version
