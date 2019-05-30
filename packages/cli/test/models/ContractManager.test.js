'use strict'

require('../setup')

import sinon from 'sinon'
import npm from 'npm-programmatic'
import { FileSystem as fs } from 'zos-lib'
import ContractManager from '../../src/models/local/ContractManager'

contract.skip('ContractManager', function([_, from]) {
  describe('getNetworkNamesFromConfig', function () {
    const configFile = `${process.cwd()}/truffle.js`
    const configFileBackup = `${configFile}.backup`

    before('backup truffle-config file', function () {
      FileSystem.copy(configFile, configFileBackup)
    })

    after('restore truffle-config file', function () {
      FileSystem.copy(configFileBackup, configFile)
      FileSystem.remove(configFileBackup)
    })

    it('finds a network in truffle network list', function () {
      FileSystem.write(configFile, 'module.exports = { networks: { test: { gas: 1, gasPrice: 2, from: \'0x0\' } } }');
      const networkNames = this.truffleConfig.getNetworkNamesFromConfig()
      networkNames.should.be.an('array')
      networkNames[0].should.eq('test')
      networkNames.should.have.lengthOf(1)
    })
  })

  describe('getContractNames', function () {
    beforeEach(function () {
      sinon.stub(Truffle.prototype, 'getBuildDir').returns(`${testDir}/build/contracts`)
    })

    afterEach(function () {
      sinon.restore()
    })

    context('without directory created', function () {
      it('throws an error', function () {
        Truffle.getContractNames().should.be.an('array').that.is.empty;
      })
    })

    context('with directory created', function () {
      beforeEach('create build/contracts/ directory', function () {
        FileSystem.createDirPath(`${testDir}/build/contracts`)
      })

      context('without contracts', function () {
        it('returns an empty array', function () {
          const contractNames = Truffle.getContractNames()
          expect(contractNames).to.be.empty
        })
      })

      context('with contracts', function () {
        it('returns an array with items inside', function () {
          FileSystem.writeJson(`${testDir}/build/contracts/Foo.json`, { sourcePath: `${testDir}/contracts`, bytecode: '0x124' })
          FileSystem.writeJson(`${testDir}/build/contracts/Bar.json`, { sourcePath: `${testDir}/contracts`, bytecode: '0x' })
          FileSystem.writeJson(`${testDir}/build/contracts/Buz.json`, { sourcePath: `other-directory/contracts`, bytecode: '0x124' })
          const contractNames = Truffle.getContractNames()

          contractNames.should.be.an('array')
          contractNames.should.not.be.empty
          contractNames.should.have.lengthOf(1)
        })
      })
    })
  })

});
