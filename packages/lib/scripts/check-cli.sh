#!/usr/bin/env bash

version=$(oz --version)
not_installed=$?

if [ "$not_installed" -ne 0 ]; then
  echo "Found no global OpenZeppelin CLI installation, required to build the @openzeppelin/upgrades package."
  echo "To install it, run:"
  echo "  npm install -g @openzeppelin/cli@^2.6"
  exit 1
fi

echo "Using OpenZeppelin CLI v$version"
