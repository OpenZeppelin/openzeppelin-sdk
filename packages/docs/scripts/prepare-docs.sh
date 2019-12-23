#!/usr/bin/env bash

set -o errexit

log() {
  echo "$*" >&2
}

yarn_with_mutex() {
  if [ -n "$YARN_MUTEX" ]; then
    yarn --mutex "$YARN_MUTEX" "$@"
  else
    yarn "$@"
  fi
}

if [ ! -d node_modules ]; then
  yarn_with_mutex --cwd ../..
fi

# lib
log "Building lib docs..."
solidity-docgen -i ../lib/contracts/ -o modules/api/pages -e ../lib/contracts/mocks -x adoc -t templates
mv modules/api/pages/index.adoc modules/api/pages/upgrades.adoc
log "Done"

# cli
log "Building CLI docs..."
yarn --cwd ../cli gen-docs
log "Done"
