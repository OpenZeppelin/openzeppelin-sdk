import path from 'path'
import Truffle from './Truffle'
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
    if (!Truffle.existsTruffleConfig(root)) {
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
