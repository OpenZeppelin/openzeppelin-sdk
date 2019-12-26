#!/usr/bin/env bash

set -o errexit

log() {
  echo "$*" >&2
}

if [ ! -d node_modules ]; then
  yarn --cwd ../..
fi

# lib
log "Building lib docs..."
solidity-docgen -i ../lib/contracts/ -o modules/api/pages -e ../lib/contracts/mocks -x adoc -t templates
mv modules/api/pages/index.adoc modules/api/pages/upgrades.adoc
log "Building lib docs... Done"

# cli
log "Building CLI docs..."
yarn --cwd ../cli gen-docs
log "Building CLI docs... Done"
