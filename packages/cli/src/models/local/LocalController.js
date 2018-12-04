'use strict'

import _ from 'lodash'
import { Contracts, Logger, FileSystem as fs, getBuildArtifacts, validate as validateContract, validationPasses} from 'zos-lib'

import Session from '../network/Session'
import Dependency from '../dependency/Dependency'
import NetworkController from '../network/NetworkController'
import ValidationLogger from '../../interface/ValidationLogger'
import TruffleProjectInitializer from '../initializer/truffle/TruffleProjectInitializer'

const log = new Logger('LocalController');

const DEFAULT_VERSION = '0.1.0';

export default class LocalController {
  constructor(packageFile) {
    this.packageFile = packageFile
  }

  init(name, version, force = false, publish = false) {
    this.initZosPackageFile(name, version, force)
    Session.ignoreFile()
    TruffleProjectInitializer.call()
    if (publish) this.packageFile.publish = publish
  }

  initZosPackageFile(name, version, force = false) {
    if (this.packageFile.exists() && !force) {
      throw Error(`Cannot overwrite existing file ${this.packageFile.fileName}`)
    }
    if (this.packageFile.name && !force) {
      throw Error(`Cannot initialize already initialized package ${this.packageFile.name}`)
    }
    this.packageFile.name = name
    this.packageFile.version = version || DEFAULT_VERSION
    this.packageFile.contracts = {}
  }

  bumpVersion(version) {
    this.packageFile.version = version
  }

  add(contractAlias, contractName) {
    log.info(`Adding ${contractAlias === contractName ? contractAlias : `${contractAlias}:${contractName}`}`)
    this.packageFile.addContract(contractAlias, contractName)
  }

  addAll() {
    const folder = Contracts.getLocalBuildDir()
    fs.readDir(folder).forEach(file => {
      const path = `${folder}/${file}`
      if(this.hasBytecode(path)) {
        const contractData = fs.parseJson(path)
        const contractName = contractData.contractName
        this.add(contractName, contractName)
      }
    })
  }

  remove(contractAlias) {
    if (!this.packageFile.hasContract(contractAlias)) {
      log.error(`Contract ${contractAlias} to be removed was not found`)
    } else {
      log.info(`Removing ${contractAlias}`)
      this.packageFile.unsetContract(contractAlias)
    }
  }

  checkCanAdd(contractName) {
    const path = Contracts.getLocalPath(contractName)
    if (!fs.exists(path)) {
      throw Error(`Contract ${contractName} not found in path ${path}`)
    }
    if (!this.hasBytecode(path)) {
      throw Error(`Contract ${contractName} is abstract and cannot be deployed.`)
    }
  }

  //Contract model
  validateAll() {
    const buildArtifacts = getBuildArtifacts();
    return _.every(_.map(this.packageFile.contractAliases, (contractAlias) => (
      this.validate(contractAlias, buildArtifacts)
    )));
  }

  //Contract model
  validate(contractAlias, buildArtifacts) {
    const contractName = this.packageFile.contract(contractAlias);
    const contractClass = Contracts.getFromLocal(contractName || contractAlias);
    const warnings = validateContract(contractClass, {}, buildArtifacts);
    new ValidationLogger(contractClass).log(warnings, buildArtifacts);
    return validationPasses(warnings);
  }

  //Contract model
  hasBytecode(contractDataPath) {
    if (!fs.exists(contractDataPath)) return false
    const bytecode = fs.parseJson(contractDataPath).bytecode
    return bytecode && bytecode !== "0x"
  }

  //Contract model
  getContractClass(packageName, contractAlias) {
    if (!packageName || packageName === this.packageFile.name) {
      const contractName = this.packageFile.contract(contractAlias);
      return Contracts.getFromLocal(contractName);
    } else {
      const dependency = new Dependency(packageName)
      const contractName = dependency.getPackageFile().contract(contractAlias)
      return Contracts.getFromNodeModules(packageName, contractName)
    }
  }

  //Contract model
  getContractSourcePath(contractAlias) {
    const contractName = this.packageFile.contract(contractAlias)
    if (contractName) {
      const contractDataPath = Contracts.getLocalPath(contractName)
      const { compiler, sourcePath } = fs.parseJson(contractDataPath)
      return { sourcePath, compilerVersion: compiler.version }
    } else {
      throw Error(`Could not find ${contractAlias} in contracts directory.`)
    }
  }

  writePackage() {
    this.packageFile.write()
  }

  //DependencyController
  async linkDependencies(dependencies, installDependencies = false) {
    await Promise.all(dependencies.map(async depNameVersion => {
      const dependency = installDependencies
        ? await Dependency.install(depNameVersion)
        : Dependency.fromNameWithVersion(depNameVersion);
      this.packageFile.setDependency(dependency.name, dependency.requirement);
    }))
  }

  //DependencyController
  unlinkDependencies(dependenciesNames) {
    dependenciesNames
      .map(dep => Dependency.fromNameWithVersion(dep))
      .forEach(dep => this.packageFile.unsetDependency(dep.name))
  }

  onNetwork(network, txParams, networkFile = undefined) {
    return new NetworkController(this, network, txParams, networkFile);
  }
}
