const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

function getNetwork() {
  const network = process.env.NETWORK;
  if (!network) throw new Error("NETWORK environment variable is required")
  return network;
}

function getProxyAddress(network, name, index) {
  const fileName = path.resolve(__dirname, `../workdir/zos.${network}.json`)
  const data = JSON.parse(fs.readFileSync(fileName))
  if (!data.proxies || !data.proxies[name] || !data.proxies[name][index]) {
    throw new Error(`Could not find proxy ${name}/${index} in data`, data)
  }
 
  const proxyAddress = data.proxies[name][index].address
  if (!proxyAddress) {
    throw new Error(`Address not found in proxy ${name}/${index}`, data.proxies[name][index])
  }

  return proxyAddress
}

function getNetworkInfo(network) {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, `../workdir/zos.${network}.json`)))
}

function logOutput(out, err) {
  if (out) out.toString().split('\n').forEach(line => _.trim(line).length > 0 && console.log("    >", line))
  if (err) err.toString().split('\n').forEach(line => _.trim(line).length > 0 && console.log("    E", line))
  console.log('    -')
}

function logCmd(cmd) {
  console.log("    $", cmd)
}

function execInWorkdir(cmd, wd = "") {
  const output = spawnSync(cmd, { cwd: path.resolve(__dirname, '../workdir', wd), shell: true });
  if (output.status != 0 || output.error) {
    logOutput(output.stdout, output.stderr)
    throw new Error(`Error running ${cmd} (err ${output.status}) ${output.error}`);
  }
  return [output.stdout.toString(), output.stderr.toString()]
}

function truffleExec(truffleCmd) {
  const cmd = `npx truffle exec scripts/${truffleCmd}`
  logCmd(cmd)
  const [output, err] = execInWorkdir(cmd)
  const outputWithoutUsingNetwork = (_.drop(output.split('\n'), 2)).join('\n')
  logOutput(outputWithoutUsingNetwork, err)
  return _.trim(outputWithoutUsingNetwork)
}

function run(cmd, cwd = "") {
  logCmd(cmd)
  const [out, err] = execInWorkdir(cmd, cwd)
  logOutput(out, err)
  return _.trim(out)
}

function copy(src, target) {
  fs.copyFileSync(path.resolve(__dirname, `../files/${src}`), path.resolve(__dirname, `../workdir/${target}`));
}

module.exports = {
  getProxyAddress,
  getNetworkInfo,
  getNetwork,
  truffleExec,
  run,
  copy
}
