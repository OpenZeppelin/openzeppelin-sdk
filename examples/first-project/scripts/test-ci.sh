set -o errexit
set -o xtrace
trap cleanup EXIT

ganache_port=9555

# Lerna bootstrap is failing to create the symlink in node_modules/.bin in the CI for some reason
# When fixed, we should change the line below to zos="node_modules/.bin/zos"
zos="node node_modules/zos/lib/bin/zos-cli.js" 

cleanup() {
  if [ -n "$ganache_pid" ] && ps -p $ganache_pid > /dev/null; then
    kill -9 $ganache_pid
  fi

  rm -f zos.dev-4447.json
}

start_ganache() {
  node_modules/.bin/ganache-cli --version
  node_modules/.bin/ganache-cli -d -i 4447 -p $ganache_port > /dev/null &
  ganache_pid=$!
}

start_ganache
sleep 2

$zos --version

$zos push --network test --no-interactive
$zos create Counter --network test --no-interactive

RESULT=$(PROVIDER_URL="http://localhost:${ganache_port}" node src/index.js)
if [ "$RESULT" != "20" ]; then
  echo "Invalid result. Expected 20, got $RESULT."
  exit 1
fi

echo $RESULT