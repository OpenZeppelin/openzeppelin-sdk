const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const workdirPath = '../../workdir';

module.exports = function (dirname) {

  // not every test have truffle config
  let truffleConfig;
  try {
    truffleConfig = require(path.resolve(dirname, workdirPath, 'truffle'));
  } catch(e) {
  }

  function getNetwork() {
    const network = process.env.NETWORK;
    if (!network) throw new Error("NETWORK environment variable is required")
    return network;
  }

  function getProxyAddress(network, name, index) {
    if (!truffleConfig) throw new Error("Truffle config is not found");

    const currentNetwork = truffleConfig.networks[network]
    const fileName = path.resolve(dirname, `${workdirPath}/${getNetworkFileName(currentNetwork)}`)
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
    if (!truffleConfig) throw new Error("Truffle config is not found");
    const currentNetwork = truffleConfig.networks[network]
    return JSON.parse(fs.readFileSync(path.resolve(dirname, `${workdirPath}/${getNetworkFileName(currentNetwork)}`)))
  }

  function logOutput(out, err) {
    if (out) out.toString().split('\n').forEach(line => _.trim(line).length > 0 && console.log("    >", line))
    if (err) err.toString().split('\n').forEach(line => _.trim(line).length > 0 && console.log("    E", line))
    console.log('    -')
  }

  function logCmd(cmd) {
    console.log("    $", cmd)
  }

  function execInWorkdir(cmd) {
    const output = spawnSync(cmd, { cwd: path.resolve(dirname, workdirPath), shell: true });
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

  function run(cmd) {
    logCmd(cmd)
    const [out, err] = execInWorkdir(cmd)
    logOutput(out, err)
    return _.trim(out)
  }

  function copy(src, target) {
    fs.copyFileSync(path.resolve(dirname, `../files/${src}`), path.resolve(dirname, `${workdirPath}/${target}`));
  }

  function sed(file, search, replace) {
    const text = fs.readFileSync(file).toString();
    const updated = text.replace(search, replace);
    fs.writeFileSync(file, updated);
  }

  function getNetworkFileName(currentNetwork) {
    const { network_id: networkId } = currentNetwork
    const name = networkId === '4' ? 'rinkeby' : `dev-${networkId}`
    return `zos.${name}.json`
  }

  function setMockStdlibVersion(version) {
    sed('package.json', /(?<=mock-stdlib-)1\.\d\.0/, version);
    sed('package-lock.json', /(?<=mock-stdlib-)1\.\d\.0/, version);
    run(`ln -nsf ../../dependencies/mock-stdlib-${version} node_modules/mock-stdlib`);
}

  return {
    getProxyAddress,
    getNetworkInfo,
    getNetwork,
    truffleExec,
    setMockStdlibVersion,
    run,
    copy,
    sed
  }
}