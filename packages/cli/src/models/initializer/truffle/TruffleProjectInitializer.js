import path from 'path'
import { FileSystem as fs } from 'zos-lib'

const TruffleProjectInitializer = {
  call(root = process.cwd()) {
    this._initContractsDir(root)
    this._initMigrationsDir(root)
    this._initTruffleConfig(root)
  },

  _initContractsDir(root) {
    const contractsDir = `${root}/contracts`
    this._initDir(contractsDir)
  },

  _initMigrationsDir(root) {
    const migrationsDir = `${root}/migrations`
    this._initDir(migrationsDir);
  },

  _initTruffleConfig(root) {
    const truffleFile = `${root}/truffle.js`
    const truffleConfigFile = `${root}/truffle-config.js`
    if (!fs.exists(truffleFile) && !fs.exists(truffleConfigFile)) {
      const blueprint = path.resolve(__dirname, './blueprint.truffle.js')
      fs.copy(blueprint, truffleConfigFile)
    }
  },

  _initDir(dir) {
    if (!fs.exists(dir)) {
      fs.createDir(dir)
      fs.write(`${dir}/.gitkeep`, '')
    }
  },
}

export default TruffleProjectInitializer
