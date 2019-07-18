#!/usr/bin/env bash

log() {
  echo "$*" >&2
}

# lib
log "Building lib docs..."
solidity-docgen -i ../lib/contracts/ -o modules/lib/pages -e ../lib/contracts/mocks -x adoc -t templates
log "Done"

# cli
log "Building CLI docs..."
cd ../cli
shopt -s globstar && rm -rf ../**/node_modules/websocket/.git
npm install --no-package-lock --no-audit
npm run gen-docs
log "Done"
