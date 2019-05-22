# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

ganache_port=9555

cleanup() {
  # Kill the ganache instance that we started (if we started one and if it's still running).
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi
}

ganache_running() {
  nc -z localhost "$ganache_port"
}

start_ganache() {
  node_modules/.bin/ganache-cli --version
  node_modules/.bin/ganache-cli --networkId 4447 -p $ganache_port -d > /dev/null &
  ganache_pid=$!
}

if ganache_running; then
  echo "Using existing ganache instance"
else
  echo "Starting our own ganache instance"
  start_ganache
fi

if [ "$CI" = true ]; then
  node_modules/.bin/truffle version
  node_modules/.bin/truffle compile
fi

TS_NODE_PROJECT="tsconfig.test.json" node_modules/.bin/truffle test --network testing "$@"
