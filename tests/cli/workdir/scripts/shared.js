const fs = require('fs')
const path = require('path')
const truffleConfig = require('../truffle')

function getProxyAddress(network, name, index) {
  const currentNetwork = truffleConfig.networks[network]
  const fileName = path.resolve(__dirname, `../${getNetworkFileName(currentNetwork)}`)
  const data = JSON.parse(fs.readFileSync(fileName))

  if (!data.proxies || !data.proxies[name] || !data.proxies[name][index]) {
    throw new Error(`Could not find proxy ${name}/${index} in data`, data)
  }
 
  const proxyAddress = data.proxies[name][index].address
  if (!proxyAddress) {
    throw new Error(`Address not found in proxy ${name}/${index}`, data.proxies[name][index])
  }

  return proxyAddress;
}

function getNetworkFileName(currentNetwork) {
  const { network_id: networkId } = currentNetwork
  const name = networkId === '4' ? 'rinkeby' : `dev-${networkId}`

  return `.openzeppelin/${name}.json`
}

module.exports = {
  getProxyAddress
}