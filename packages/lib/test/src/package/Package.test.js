'use strict'
require('../../setup')

import Package from '../../../src/package/Package'
import Contracts from '../../../src/utils/Contracts'
import { deploy as deployContract } from '../../../src/utils/Transactions'
import FreezableImplementationDirectory from '../../../src/directory/FreezableImplementationDirectory';
import ImplementationDirectory from '../../../src/directory/ImplementationDirectory';

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')

contract('Package', function ([_, owner]) {
  const txParams = { from: owner }
  const contractName = 'DummyImplementation'
  const version = "1.0"
  const version2 = "2.0"

  shouldBehaveLikePackage(ImplementationDirectory)
  
  shouldBehaveLikePackage(FreezableImplementationDirectory, { onNewVersion: function () {
    it('is freezable', async function () {
      await this.package.freeze(version)
      const frozen = await this.package.isFrozen(version)
      frozen.should.be.true
    })
  }})

  function shouldBehaveLikePackage(directoryClass, { onNewVersion } = {}) {
    describe(`with ${directoryClass.name}`, function () {
      const shouldInitialize = function () {
        it('instantiates the package', async function() {
          this.package.contract.should.not.be.null
          this.package.address.should.be.nonzeroAddress
        })
      }

      const deploy = async function () {
        this.package = await Package.deploy(txParams, directoryClass)
      }

      describe('deploy', function () {
        beforeEach('deploying package', deploy)
        shouldInitialize()
      })

      describe('fetch', function () {
        beforeEach('deploying package', deploy)
        beforeEach("connecting to existing instance", async function () {
          this.package = await Package.fetch(this.package.address, txParams, directoryClass)
        })
        shouldInitialize()
      })

      describe('newVersion', function () {
        beforeEach('deploying package', deploy)
        beforeEach('adding a new version', async function () {
          await this.package.newVersion(version)
        })

        it('returns version directory', async function () {
          const directory = await this.package.getDirectory(version)
          directory.address.should.be.nonzeroAddress
          directory.should.be.instanceof(directoryClass)
        })

        it('registers new version on package', async function () {
          const hasVersion = await this.package.hasVersion(version)
          hasVersion.should.be.true
        })

        it('is not frozen by default', async function () {
          const frozen = await this.package.isFrozen(version)
          frozen.should.be.false
        })

        if (onNewVersion) {
          onNewVersion()
        }
      })

      describe('setImplementation', function () {
        beforeEach('deploying package', deploy)
        
        beforeEach('setting versions', async function () {
          await this.package.newVersion(version)
          await this.package.newVersion(version2)
        })

        beforeEach('setting an implementation', async function () {
          this.implementation = await deployContract(DummyImplementation)
          await this.package.setImplementation(version, contractName, this.implementation)
        })

        it('gets the implementation from the correct version', async function () {
          const implementation = await this.package.getImplementation(version, contractName)
          implementation.should.eq(this.implementation.address)
        })

        it('returns zero when requesting from another version', async function () {
          const implementation = await this.package.getImplementation(version2, contractName)
          implementation.should.be.zeroAddress
        })

        it('returns zero when requesting another contract name', async function () {
          const implementation = await this.package.getImplementation(version, 'NOTEXISTS')
          implementation.should.be.zeroAddress
        })

        it('unsets the implementation', async function () {
          await this.package.unsetImplementation(version, contractName)
          const implementation = await this.package.getImplementation(version, contractName)
          implementation.should.be.zeroAddress
        })
      })
    })
  }
})
