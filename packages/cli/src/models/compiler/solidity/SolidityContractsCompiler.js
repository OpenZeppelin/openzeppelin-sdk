import _ from 'lodash'
import solc from 'solc'
import axios from 'axios'
import { Logger, FileSystem } from 'zos-lib'
import SolidityDependenciesFinder from './SolidityDependenciesFinder'

const log = new Logger('SolidityContractsCompiler')

const DEFAULT_OPTIMIZER = { enabled: false }
const DEFAULT_EVM_VERSION = 'byzantium'
const VERSIONS_URL = 'https://solc-bin.ethereum.org/bin/list.json'
const OUTPUT_SELECTION = {
  '*': {
    "": [
      "legacyAST",
      "ast"
    ],
    "*": [
      "abi",
      "evm.bytecode.object",
      "evm.bytecode.sourceMap",
      "evm.deployedBytecode.object",
      "evm.deployedBytecode.sourceMap"
    ]
  }
}

export default class SolidityContractsCompiler {
  static latestVersion() {
    return solc.version()
  }

  constructor(contracts, { version, optimizer, evmVersion } = {}) {
    this.errors = []
    this.contracts = contracts
    this.optimizer = optimizer || DEFAULT_OPTIMIZER
    this.evmVersion = evmVersion || DEFAULT_EVM_VERSION
    this.version = version || SolidityContractsCompiler.latestVersion()
    this.settings = {
      optimizer: this.optimizer,
      evmVersion: this.evmVersion,
      outputSelection: OUTPUT_SELECTION
    }
  }

  async call() {
    const solcOutput = await this._compile()
    return this._buildContractsSchemas(solcOutput)
  }

  async solc() {
    if (this.version === SolidityContractsCompiler.latestVersion()) return solc
    const version = await this._findVersion()
    const parsedVersion = version.replace('soljson-', '').replace('.js', '')
    return new Promise((resolve, reject) => {
      solc.loadRemoteVersion(parsedVersion, (error, compiler) => {
        return error ? reject(error) : resolve(compiler)
      })
    })
  }

  async versions() {
    const response = await axios.request({ url: VERSIONS_URL })
    if (response.status === 200) return response.data
    else throw Error(`Could not fetch solc versions from ${VERSIONS_URL} (status ${response.status})`)
  }

  async _compile() {
    const input = this._buildCompilerInput()
    const requestedSolc = await this.solc()
    const output = requestedSolc.compile(JSON.stringify(input), dep => this._findDependency(dep, this))
    const parsedOutput = JSON.parse(output)
    const outputErrors = parsedOutput.errors || []
    if (outputErrors.length === 0) return parsedOutput

    const errors = outputErrors.filter(finding => finding.severity !== 'warning')
    const warnings = outputErrors.filter(finding => finding.severity === 'warning')
    const errorMessages = errors.map(error => error.formattedMessage).join('\n')
    const warningMessages = warnings.map(warning => warning.formattedMessage).join('\n')

    if (warnings.length > 0) log.warn(`Compilation warnings: \n${warningMessages}`)
    if (errors.length > 0) throw Error(`Compilation errors: \n${errorMessages}`)
    return parsedOutput
  }

  _buildCompilerInput() {
    return {
      language: 'Solidity',
      settings: this.settings,
      sources: this._buildSources(),
    }
  }

  _buildSources() {
    return this.contracts.reduce((sources, contract) => {
      log.info(`Compiling ${contract.fileName} ...`)
      sources[contract.filePath] = { content: contract.source }
      return sources
    }, {})
  }

  _findDependency(dependencyPath, compiler) {
    const dependencyName = dependencyPath.substring(dependencyPath.lastIndexOf('/') + 1)
    let dependencyContract = compiler.contracts.find(contract => contract.fileName === dependencyName)
    if (!dependencyContract) dependencyContract = SolidityDependenciesFinder.call(dependencyPath)
    if (!dependencyContract) return { error: 'File not found' }
    log.info(`Compiling ${dependencyName} ...`)
    compiler.contracts.push(dependencyContract)
    return { content: dependencyContract.source }
  }

  async _findVersion() {
    const versions = await this.versions()
    if (versions.releases[this.version]) return versions.releases[this.version]
    const isPrerelease = this.version.includes('nightly') || this.version.includes('commit')
    if (isPrerelease) {
      const isVersion = build => build['prerelease'] === version || build['build'] === version || build['longVersion'] === version
      const build = versions.builds.find(isVersion)
      if (build) return build['path']
    }
    throw Error(`Could not find version ${this.version} in ${VERSIONS_URL}`)
  }

  _buildContractsSchemas(solcOutput) {
    const paths = Object.keys(solcOutput.contracts)
    return _.flatMap(paths, fileName => {
      const contractNames = Object.keys(solcOutput.contracts[fileName])
      return contractNames.map(contractName => this._buildContractSchema(solcOutput, fileName, contractName))
    })
  }

  _buildContractSchema(solcOutput, fileName, contractName) {
    const output = solcOutput.contracts[fileName][contractName]
    const source = solcOutput.sources[fileName]
    fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
    const contract = this.contracts.find(contract => contract.fileName === fileName)

    return {
      fileName,
      contractName,
      source: contract.source,
      sourcePath: contract.filePath,
      sourceMap: output.evm.bytecode.sourceMap,
      abi: output.abi,
      ast: source.ast,
      legacyAST: source.legacyAST,
      bytecode: `0x${this._solveLibraryLinks(output.evm.bytecode)}`,
      deployedBytecode: `0x${this._solveLibraryLinks(output.evm.deployedBytecode)}`,
      compiler: {
        'name': 'solc',
        'version': this.version,
        'optimizer': this.optimizer,
        'evmVersion': this.evmVersion,
      }
    }
  }

  _solveLibraryLinks(outputBytecode) {
    const librariesPaths = Object.keys(outputBytecode.linkReferences)
    if (librariesPaths.length === 0) return outputBytecode.object
    const links = librariesPaths.map(path => outputBytecode.linkReferences[path])
    return links.reduce((replacedBytecode, link) => {
      return Object.keys(link).reduce((subReplacedBytecode, libraryName) => {
        const linkReferences = link[libraryName] || []
        return this._replaceLinkReferences(subReplacedBytecode, linkReferences, libraryName)
      }, replacedBytecode)
    }, outputBytecode.object)
  }


  _replaceLinkReferences(bytecode, linkReferences, libraryName) {
    // offset are given in bytes, we multiply it by 2 to work with character offsets
    return linkReferences.reduce((bytecode, ref) => {
      const start = ref.start * 2
      const length = ref.length * 2
      let linkId = `__${libraryName}`
      linkId += '_'.repeat(length - linkId.length)
      return bytecode.substring(0, start) + linkId + bytecode.substring(start + length)
    }, bytecode)
  }
}
