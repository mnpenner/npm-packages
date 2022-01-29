#!/usr/bin/env bash
set -xeufo pipefail

find dist -mindepth 1 -maxdepth 1 -exec rm -r -- {} +
rm -f tsconfig.tsbuildinfo .pnpm-debug.log
