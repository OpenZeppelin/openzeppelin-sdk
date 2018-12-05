import glob from 'glob'
import path from 'path'
import ZWeb3 from '../artifacts/ZWeb3'
import ContractFactory from '../artifacts/ContractFactory'

const DEFAULT_SYNC_TIMEOUT = 240000
const DEFAULT_BUILD_DIR = `${process.cwd()}/build/contracts`

// TODO: rename to Artifacts and move to /artifacts
export default {
  getSyncTimeout() {
    return this.timeout || DEFAULT_SYNC_TIMEOUT
  },

  getLocalBuildDir() {
    return this.buildDir || DEFAULT_BUILD_DIR
  },

  getArtifactsDefaults() {
    return this.artifactDefaults || {}
  },

  getLocalPath(contractName) {
    return `${this.getLocalBuildDir()}/${contractName}.json`
  },

  getLibPath(contractName) {
    return path.resolve(__dirname, `../../build/contracts/${contractName}.json`)
  },

  getNodeModulesPath(dependency, contractName) {
    return `${process.cwd()}/node_modules/${dependency}/build/contracts/${contractName}.json`
  },

  getFromLocal(contractName) {
    return this._getFromPath(this.getLocalPath(contractName))
  },

  getFromLib(contractName) {
    return this._getFromPath(this.getLibPath(contractName))
  },

  getFromNodeModules(dependency, contractName) {
    return this._getFromPath(this.getNodeModulesPath(dependency, contractName))
  },

  listBuildArtifacts() {
    return glob.sync(`${this.getLocalBuildDir()}/*.json`)
  },

  setSyncTimeout(value) {
    this.timeout = value
  },

  setLocalBuildDir(dir) {
    this.buildDir = dir
  },

  setArtifactsDefaults(defaults) {
    this.artifactDefaults = { ...this.getArtifactsDefaults(), ...defaults }
  },

  _getFromPath(path) {
    const schema = require(path)
    return new ContractFactory(schema, this.getSyncTimeout(), this.getArtifactsDefaults())
  },
}
