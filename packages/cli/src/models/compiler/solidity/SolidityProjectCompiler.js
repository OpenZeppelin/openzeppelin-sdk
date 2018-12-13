import path from 'path'
import { FileSystem as fs } from 'zos-lib'
import SolidityContractsCompiler from './SolidityContractsCompiler'

export default class SolidityProjectCompiler {
  constructor(inputDir, outputDir, options = {}) {
    this.inputDir = inputDir
    this.outputDir = outputDir
    this.contracts = []
    this.compilerOutput = []
    this.options = options
  }

  async call() {
    this._loadSoliditySourcesFromDir(this.inputDir)
    await this._compile()
    this._writeOutput()
  }

  _loadSoliditySourcesFromDir(dir) {
    fs.readDir(dir).forEach(fileName => {
      const filePath = path.resolve(dir, fileName)
      if (fs.isDir(filePath)) this._loadSoliditySourcesFromDir(filePath)
      else if (this._isSolidityFile(filePath)) {
        const source = fs.read(filePath)
        const contract = { fileName, filePath, source }
        this.contracts.push(contract)
      }
    })
  }

  async _compile() {
    const solidityCompiler = new SolidityContractsCompiler(this.contracts, this.options)
    this.compilerOutput = await solidityCompiler.call()
  }

  _writeOutput() {
    if (!fs.exists(this.outputDir)) fs.createDirPath(this.outputDir)
    this.compilerOutput.forEach(data => {
      const buildFileName = `${this.outputDir}/${data.contractName}.json`
      fs.writeJson(buildFileName, data)
    })
  }

  _isSolidityFile(fileName) {
    const solidityExtension = '.sol'
    const fileExtension = path.extname(fileName).toLowerCase()
    return fileExtension === solidityExtension
  }
}
