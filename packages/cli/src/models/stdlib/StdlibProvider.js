import { FileSystem as fs } from 'zos-lib'

export default {
  from(name, network) {
    const filename = `node_modules/${name}/package.zos.${network}.json`
    const networkInfo = fs.parseJson(filename)
    return networkInfo.provider.address
  }
}
