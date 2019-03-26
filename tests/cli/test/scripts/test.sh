#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -eo pipefail

# Executes cleanup function at script exit.
trap cleanup EXIT

# Define geth port
geth_port=8545

geth_running() {
  # Checks if geth is runnng
  nc -z localhost "$geth_port"
}

validate() {
  # Validates required env vars are properly set
  if [[ -z "${NETWORK}" ]]; then
    echo "NETWORK environment variable is missing"
    exit 1
  fi
}

cleanup() {
  # Kill the geth instance that we started (if we started one and if it's still running).
  if [ -n "$geth_pid" ] && ps -p $geth_pid > /dev/null; then
    kill -9 $geth_pid
  fi
}

start_geth() {
  # Start a geth development instance in the background
  echo "Starting local dev geth"
  geth version
  nohup geth --dev --dev.period=1 --rpc --rpcport=$geth_port --rpcaddr=localhost --networkid 9955 --datadir=.ethereum > /dev/null &
  geth_pid=$!
  sleep 3
  echo "Running local dev geth with pid ${geth_pid}"
}

fund_account() {
  # Funds a target account
  target_account="0x4da710efab33a9986b35e5c1de7e97f7e0704c18"
  RECIPIENT_ACCOUNT=$target_account node_modules/.bin/truffle exec scripts/fund.js --network geth-dev
  sleep 1
  echo "Account $target_account funded"
}

run_tests() {
  # Run via mocha
  node_modules/.bin/mocha --bail --timeout=120s src
}

main() {
  validate
  
  if geth_running; then
    echo "Using existing geth instance at port $geth_port"
  else
    start_geth
  fi

  if [ "$NETWORK" = "geth-dev-hdwallet" ]; then
    fund_account
  fi

  run_tests
}

main
