import fs from '../../zos-lib/utils/FileSystem'

export default {
  from(name, network) {
    if (!network) throw "Must specify network to read stdlib deployment address"
    const filename = `node_modules/${name}/package.zos.${network}.json`
    const networkInfo = fs.parseJson(filename)
    return networkInfo.provider.address
  }
}
