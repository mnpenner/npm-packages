#!/usr/bin/env -S node --loader ${PWD}/.pnp.loader.mjs
import ghpages from 'gh-pages'

ghpages.publish('docs', {
    branch: 'gh-pages',
    repo: 'git@github.com:mnpenner/imut-utils.git'
})

