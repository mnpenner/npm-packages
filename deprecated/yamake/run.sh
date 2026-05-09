#!/usr/bin/env bash
set -xeufo pipefail

wnpx ts-node --transpile-only src/index.ts run
