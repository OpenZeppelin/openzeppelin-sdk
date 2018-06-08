# Exit script as soon as a command fails.
set -o errexit

if [ "$SOLIDITY_COVERAGE" = true ]; then
  echo "Measuring coverage..."
  node_modules/.bin/solidity-coverage
  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
  node_modules/.bin/truffle compile

  echo "Testing root project..."
  node_modules/.bin/truffle test "$@"

  echo "Testing examples..."
  npm run prepack
  cd examples/complex
  npm i
  npm test
fi
