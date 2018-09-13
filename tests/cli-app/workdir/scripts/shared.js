const fs = require('fs')
const path = require('path')

function getProxyAddress(network, name, index) {
  const fileName = path.resolve(__dirname, `../zos.${network}.json`)
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

module.exports = {
  getProxyAddress
}