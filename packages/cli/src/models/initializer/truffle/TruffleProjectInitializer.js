import path from 'path'
import { FileSystem as fs } from 'zos-lib'
import TruffleConfig from './TruffleConfig'

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
    if (TruffleConfig.exists(root)) {
      const blueprint = path.resolve(__dirname, './blueprint.truffle.js')
      fs.copy(blueprint, `${root}/truffle-config.js`)
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
