#!/usr/bin/env bash

set -o errexit

log() {
  echo "$*" >&2
}

if [ ! -d node_modules ]; then
  yarn --cwd ../..
fi

log "Building API reference for Upgrades contracts..."
solidity-docgen -i contracts/ -o docs/modules/ROOT/pages/api -e contracts/mocks -x adoc -t docs/templates
mv docs/modules/ROOT/pages/api/index.adoc docs/modules/ROOT/pages/api.adoc
log "Building API reference for Upgrades contracts... Done"
