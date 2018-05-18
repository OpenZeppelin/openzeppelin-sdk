import { FileSystem as fs } from 'zos-lib'

const StdlibProvider = {
  from(name, version, network) {
    const filename = `node_modules/${name}/zos.${network}.json`
    const networkInfo = fs.parseJson(filename)
    if(version !== networkInfo.version) throw Error(`Requested stdlib version ${version} does not match stdlib network package version ${networkInfo.version}`)
    return networkInfo.provider.address
  }
}

export default StdlibProvider
