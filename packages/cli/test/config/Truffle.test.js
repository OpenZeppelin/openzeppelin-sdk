require('../setup')

import npm from 'npm-programmatic';
import sinon from 'sinon'

import { FileSystem } from 'zos-lib'
import Truffle from '../../src/models/config/Truffle'
import CaptureLogs from '../helpers/captureLogs'

contract('Truffle', () => {
  const testDir = `${process.cwd()}/test/tmp`
  
  beforeEach('create test dir', function () {
    FileSystem.createDir(testDir)
    this.truffleConfig = new Truffle();
  })

  afterEach('remove test dir', function () {
    FileSystem.removeTree(testDir)
  })

  describe('existsTruffleConfig', function () {
    it('returns true when there is a truffle.js file', function () {
      FileSystem.write(`${testDir}/truffle.js`, 'dummy')

      this.truffleConfig.existsTruffleConfig(testDir).should.be.true
    })

    it('returns true when there is a truffle-config.js file', function () {
      FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')

      this.truffleConfig.existsTruffleConfig(testDir).should.be.true
    })

    it('returns true when there are both truffle config files', function () {
      FileSystem.write(`${testDir}/truffle.js`, 'dummy')
      FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')

      this.truffleConfig.existsTruffleConfig(testDir).should.be.true
    })

    it('returns false when there is no truffle config file', function () {
      FileSystem.write(`${testDir}/bla.js`, 'dummy')

      this.truffleConfig.existsTruffleConfig(testDir).should.be.false
    })
  })

  describe('isTruffleProject', function () {
    describe('when there is a truffle dependency', function () {
      beforeEach('create truffle config file', function () {
        FileSystem.createDir(`${testDir}/node_modules`)
        FileSystem.createDir(`${testDir}/node_modules/truffle`)
      })

      describe('when there is a truffle config file', function () {
        beforeEach('create truffle config file', function () {
          FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')
        })

        it('returns true', function () {
          this.truffleConfig.isTruffleProject(testDir).should.be.true
        })
      })

      describe('when there is no truffle config file', function () {
        it('returns false', function () {
          this.truffleConfig.isTruffleProject(testDir).should.be.false
        })
      })
    })

    describe('when there is no truffle dependency', function () {
      describe('when there is a truffle config file', function () {
        beforeEach('create truffle config file', function () {
          FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')
        })

        it('returns false', function () {
          this.truffleConfig.isTruffleProject(testDir).should.be.false
        })
      })

      describe('when there is no truffle config file', function () {
        it('returns false', function () {
          this.truffleConfig.isTruffleProject(testDir).should.be.false
        })
      })
    })
  })

  describe('loadNetworkConfig', function () {
    const configFile = `${process.cwd()}/truffle.js`
    const configFileBackup = `${configFile}.backup`

    before('backup truffle-config file', function () {
      FileSystem.copy(configFile, configFileBackup)
    })

    after('restore truffle-config file', function () {
      FileSystem.copy(configFileBackup, configFile)
      FileSystem.remove(configFileBackup)
    })

    context('when the requested network has default values', function () {
      beforeEach('create truffle config file', async function () {
        FileSystem.write(configFile, 'module.exports = { networks: { test: { gas: 1, gasPrice: 2, from: \'0x0\' } } }')
        this.config = await this.truffleConfig.loadNetworkConfig('test', true)
      })

      it('uses network default gas, gas price and from values', function () {
        const { artifactDefaults } = this.config

        artifactDefaults.should.have.all.keys('gas', 'gasPrice', 'from')
        artifactDefaults.gas.should.be.eq(1)
        artifactDefaults.gasPrice.should.be.eq(2)
        artifactDefaults.from.should.be.eq('0x0')
      })
    })

    context('when the requested network does not have default values', function () {
      beforeEach('create truffle config file', async function () {
        FileSystem.write(configFile, 'module.exports = { networks: { test: { } } }')
        this.config = await this.truffleConfig.loadNetworkConfig('test', true)
      })

      it('uses Truffle default gas price', function () {
        const { artifactDefaults } = this.config

        artifactDefaults.should.have.all.keys('gasPrice')
        artifactDefaults.gasPrice.should.be.eq(20000000000)
      })
    })

    context('when using truffle-hdwallet-provider', function () {
      beforeEach(async function () {
        sinon.stub(Truffle.prototype, 'getConfig').returns({ networks: { test: {} }, provider: { constructor: { name: 'HDWalletProvider' } } })
        sinon.stub(npm, 'list').resolves(['truffle-hdwallet-provider@0.0.6'])
        this.logs = new CaptureLogs()
      })

      afterEach(function () {
        sinon.restore()
        this.logs.restore()
      })

      it('logs a warning message', async function () {
        await this.truffleConfig.loadNetworkConfig('test', true)
        this.logs.warns.should.have.lengthOf(1)
        this.logs.warns[0].should.match(/Version 0.0.6 of truffle-hdwallet-provider might fail when deploying multiple contracts. /)
      })
    })
  })
})
