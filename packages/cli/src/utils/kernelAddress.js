import fs from 'fs'

export default function kernelAddress(network) {
  const file = `node_modules/kernel/package.zos.${network}.json`;
  const json = fs.readFileSync(file);
  const data = JSON.parse(json)
  const proxies = data.proxies.Kernel
  if(proxies.length === 0) return 0
  const lastProxy = proxies[proxies.length - 1]
  return lastProxy.address
}
