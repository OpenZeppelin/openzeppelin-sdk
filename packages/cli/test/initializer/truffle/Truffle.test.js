require('../../setup')

import npm from 'npm-programmatic';
import sinon from 'sinon'

import { FileSystem } from 'zos-lib'
import Truffle from '../../../src/models/initializer/truffle/Truffle'
import CaptureLogs from '../../helpers/captureLogs'

contract('Truffle', () => {
  const testDir = `${process.cwd()}/test/tmp`
  
  beforeEach('create test dir', function () {
    FileSystem.createDir(testDir)
  })

  afterEach('remove test dir', function () {
    FileSystem.removeTree(testDir)
  })

  describe('existsTruffleConfig', function () {
    it('returns true when there is a truffle.js file', function () {
      FileSystem.write(`${testDir}/truffle.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.true
    })

    it('returns true when there is a truffle-config.js file', function () {
      FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.true
    })

    it('returns true when there are both truffle config files', function () {
      FileSystem.write(`${testDir}/truffle.js`, 'dummy')
      FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.true
    })

    it('returns false when there is no truffle config file', function () {
      FileSystem.write(`${testDir}/bla.js`, 'dummy')

      Truffle.existsTruffleConfig(testDir).should.be.false
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
          Truffle.isTruffleProject(testDir).should.be.true
        })
      })

      describe('when there is no truffle config file', function () {
        it('returns false', function () {
          Truffle.isTruffleProject(testDir).should.be.false
        })
      })
    })

    describe('when there is no truffle dependency', function () {
      describe('when there is a truffle config file', function () {
        beforeEach('create truffle config file', function () {
          FileSystem.write(`${testDir}/truffle-config.js`, 'dummy')
        })

        it('returns false', function () {
          Truffle.isTruffleProject(testDir).should.be.false
        })
      })

      describe('when there is no truffle config file', function () {
        it('returns false', function () {
          Truffle.isTruffleProject(testDir).should.be.false
        })
      })
    })
  })

  describe('validateAndLoadNetworkConfig', function () {
    context('when the requested network does not exist in the truffle config file', function () {
      context('when truffle config file is truffle.js', function () {
        it('throws an error', function () {
          FileSystem.write(`${testDir}/truffle.js`, 'module.exports = { networks: { test: { gas: 1, gasPrice: 2, from: \'0x0\' } } }');
          (() => Truffle.validateAndLoadNetworkConfig('non-existent', true, testDir)).should.throw(/is not defined in your truffle.js file/);
        })
      })

      context('when truffle config file is truffle-config.js', function () {
        it('throws an error', function () {
          FileSystem.write(`${testDir}/truffle-config.js`, 'module.exports = { networks: { test: { gas: 1, gasPrice: 2, from: \'0x0\' } } }');
          (() => Truffle.validateAndLoadNetworkConfig('non-existent', true, testDir)).should.throw(/is not defined in your truffle-config.js file/);
        })
      })
    })
  })

  describe('getProviderAndDefaults', function () {
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
      beforeEach('create truffle config file', function () {
        FileSystem.write(configFile, 'module.exports = { networks: { test: { gas: 1, gasPrice: 2, from: \'0x0\' } } }')
        Truffle.validateAndLoadNetworkConfig('test', true)
      })

      it('uses network default gas, gas price and from values', async function () {
        const { artifactDefaults } = await Truffle.getProviderAndDefaults()

        artifactDefaults.should.have.all.keys('gas', 'gasPrice', 'from')
        artifactDefaults.gas.should.be.eq(1)
        artifactDefaults.gasPrice.should.be.eq(2)
        artifactDefaults.from.should.be.eq('0x0')
      })
    })

    context('when the requested network does not have default values', function () {
      beforeEach('create truffle config file', function () {
        FileSystem.write(configFile, 'module.exports = { networks: { test: { } } }')
        Truffle.validateAndLoadNetworkConfig('test', true)
      })

      it('uses Truffle default gas price', async function () {
        const { artifactDefaults } = await Truffle.getProviderAndDefaults()

        artifactDefaults.should.have.all.keys('gasPrice')
        artifactDefaults.gasPrice.should.be.eq(20000000000)
      })
    })

    context('when using truffle-hdwallet-provider', function () {
      beforeEach(function () {
        const config = Truffle.getConfig()
        sinon.stub(Truffle, 'getConfig').returns({ provider: { constructor: { name: 'HDWalletProvider' } } })
        sinon.stub(npm, 'list').resolves(['truffle-hdwallet-provider@0.0.6'])
        this.logs = new CaptureLogs()
      })

      afterEach(function () {
        sinon.restore()
        this.logs.restore()
      })

      it('logs a warning message', async function () {
        await Truffle.getProviderAndDefaults()
        this.logs.warns.should.have.lengthOf(1)
        this.logs.warns[0].should.match(/Version 0.0.6 of truffle-hdwallet-provider might fail when deploying multiple contracts. /)
      })
    })
  })

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
      const networkNames = Truffle.getNetworkNamesFromConfig()
      networkNames.should.be.an('array')
      networkNames[0].should.eq('test')
      networkNames.should.have.lengthOf(1)
    })
  })

  describe('getContractNames', function () {
    beforeEach(function () {
      sinon.stub(Truffle, 'getBuildDir').returns(`${testDir}/build/contracts`)
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
})
