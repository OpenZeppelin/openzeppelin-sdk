set -o errexit

if [ "$SOLIDITY_COVERAGE" = true ]; then
  echo "Skipping CLI test suite on solidity coverage run"
else
  node_modules/.bin/truffle compile
  TS_NODE_PROJECT="tsconfig.test.json" node_modules/.bin/truffle test "$@"
fi
