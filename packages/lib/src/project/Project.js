import { deploy } from "../utils/Transactions";
import Logger from "../utils/Logger";

const log = new Logger('Project')

export default class Project {

  constructor(txParams) {
    this.txParams = txParams
  }

  async newVersion(version) {
    const thepackage = await this.getProjectPackage()
    const directory = await thepackage.newVersion(version)
    this.directory = directory
    this.version = version
    return directory
  } 

  async setImplementation(contractClass, contractName) {
    log.info(`Setting implementation of ${contractName} in directory...`)
    const implementation = await deploy(contractClass, [], this.txParams)
    const directory = await this.getCurrentDirectory()
    await directory.setImplementation(contractName, implementation.address)
    log.info(`Implementation set: ${implementation.address}`)
    return implementation
  }

  async unsetImplementation(contractName) {
    log.info(`Unsetting implementation of ${contractName}...`)
    const directory = await this.getCurrentDirectory()
    await directory.unsetImplementation(contractName)
  }

  async getCurrentDirectory() {
    throw Error("Unimplemented")
  }

  async getProjectPackage() {
    throw Error("Unimplemented")
  }  
}