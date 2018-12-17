import { exec } from 'child_process'
import { FileSystem, Contracts, Logger } from 'zos-lib'
import Truffle from '../initializer/truffle/Truffle'
import SolidityProjectCompiler from './solidity/SolidityProjectCompiler'

const log = new Logger('Compiler')

export default {
  async call() {
    return Truffle.isTruffleProject()
      ? this.compileWithTruffle()
      : this.compileWithSolc()
  },

  getSettings() {
    return this.settings || {}
  },

  setSettings(settings) {
    this.settings = { ...this.getSettings(), ...settings }
  },

  async compileWithSolc() {
    const inputDir = Contracts.getLocalContractsDir()
    const outputDir = Contracts.getLocalBuildDir()
    const options = this.getSettings()
    const projectCompiler = new SolidityProjectCompiler(inputDir, outputDir, options)
    log.info('Compiling contracts with solc...')
    await projectCompiler.call()
  },

  async compileWithTruffle() {
    log.info('Compiling contracts with Truffle...')
    return new Promise((resolve, reject) => {
      exec('npx truffle compile', (err, stdout, stderr) => {
        if (err) reject(err)
        else resolve({ stdout, stderr })
      })
    })
  },
}
