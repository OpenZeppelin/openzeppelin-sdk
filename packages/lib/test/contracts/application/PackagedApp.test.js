'use strict';

import encodeCall from '../../../src/helpers/encodeCall'
import decodeLogs from '../../../src/helpers/decodeLogs'
import assertRevert from '../../../src/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable'

const Package = artifacts.require('Package')
const ImplementationDirectory = artifacts.require('ImplementationDirectory')
const MigratableMock = artifacts.require('MigratableMock')
const PackagedApp = artifacts.require('PackagedApp')
const DummyImplementation = artifacts.require('DummyImplementation')
const AdminUpgradeabilityProxy = artifacts.require('AdminUpgradeabilityProxy')
const UpgradeabilityProxyFactory = artifacts.require('UpgradeabilityProxyFactory')

contract('PackagedApp', ([_, appOwner, packageOwner, directoryOwner, anotherAccount]) => {
  const contract = 'ERC721'
  const version_0 = 'version_0'
  const version_1 = 'version_1'

  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.factory = await UpgradeabilityProxyFactory.new()
    this.package = await Package.new({ from: packageOwner })
    this.zeroVersionDirectory = await ImplementationDirectory.new({ from: directoryOwner })
    this.firstVersionDirectory = await ImplementationDirectory.new({ from: directoryOwner })
  })

  describe('when the package address is null', function () {
    it('reverts', async function () {
      await assertRevert(PackagedApp.new(0, 'dummy', this.factory.address))
    })
  })

  describe('when the given package does not support the required version', function () {
    it('reverts', async function () {
      await assertRevert(PackagedApp.new(this.package.address, version_0, this.factory.address, { from: appOwner }))
    })
  })

  describe('when the given package supports the required version', function () {
    beforeEach(async function () {
      await this.package.addVersion(version_0, this.zeroVersionDirectory.address, { from: packageOwner })
      this.app = await PackagedApp.new(this.package.address, version_0, this.factory.address, { from: appOwner })
    })

    describe('ownership', function () {
      beforeEach(function () {
        this.ownable = this.app
      })

      shouldBehaveLikeOwnable(appOwner, anotherAccount)
    })

    describe('factory', function () {
      it('returns the proxy factory being used by the app', async function () {
        const factory = await this.app.factory()

        assert.equal(factory, this.factory.address)
      })
    })

    describe('setVersion', function () {
      const version = version_1

      describe('when the sender is the app owner', function () {
        const from = appOwner

        describe('whern the requested version is registered in the package', function () {
          beforeEach(async function () {
            await this.package.addVersion(version_1, this.firstVersionDirectory.address, { from: packageOwner })
          })

          it('sets a new version', async function () {
            await this.app.setVersion(version, { from })

            const newVersion = await this.app.version()
            assert.equal(newVersion, version_1)
          })
        })

        describe('when the requested version is registered in the package', function () {
          it('reverts', async function () {
            await assertRevert(this.app.setVersion(version, { from }))
          })
        })
      })

      describe('when the sender is the app owner', function () {
        it('reverts', async function () {
          await assertRevert(this.app.setVersion(version_1, { from: anotherAccount }))
        })
      })
    })

    describe('create', function () {
      describe('when the requested contract was registered for the current version', function () {
        beforeEach(async function () {
          await this.zeroVersionDirectory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })

          const { receipt } = await this.app.create(contract)
          this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
          this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
          this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)
        })

        it('creates a proxy pointing to the requested implementation', async function () {
          const implementation = await this.app.getProxyImplementation(this.proxy.address)
          assert.equal(implementation, this.implementation_v0)
        })

        it('transfers the ownership to the app', async function () {
          const admin = await this.app.getProxyAdmin(this.proxy.address)
          assert.equal(admin, this.app.address)
        })
      })

      describe('when the requested contract was not registered for the current version', function () {
        it('reverts', async function () {
          await assertRevert(this.app.create(contract))
        })
      })
    })

    describe('createAndCall', function () {
      const value = 1e5
      const initializeData = encodeCall('initialize', ['uint256'], [42])

      beforeEach(async function () {
        this.behavior = await MigratableMock.new()
      })

      describe('when the requested contract was registered for the current version', function () {
        beforeEach(async function () {
          await this.zeroVersionDirectory.setImplementation(contract, this.behavior.address, { from: directoryOwner })

          const { receipt } = await this.app.createAndCall(contract, initializeData, { value })
          this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
          this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
          this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)
        })

        it('creates a proxy pointing to the requested implementation', async function () {
          const implementation = await this.app.getProxyImplementation(this.proxy.address)
          assert.equal(implementation, this.behavior.address)
        })

        it('transfers the ownership to the app', async function () {
          const admin = await this.app.getProxyAdmin(this.proxy.address)
          assert.equal(admin, this.app.address)
        })

        it('calls "initialize" function', async function() {
          const initializable = MigratableMock.at(this.proxyAddress)
          const x = await initializable.x()
          assert.equal(x, 42)
        })

        it('sends given value to the delegated implementation', async function() {
          const balance = await web3.eth.getBalance(this.proxyAddress)
          assert(balance.eq(value))
        })

        it('uses the storage of the proxy', async function () {
          // fetch the x value of Migratable at position 0 of the storage
          const storedValue = await web3.eth.getStorageAt(this.proxyAddress, 1)
          assert.equal(storedValue, 42)
        })
      })

      describe('when the requested contract was not registered for the current version', function () {
        it('reverts', async function () {
          await assertRevert(this.app.createAndCall(contract, initializeData, { value }))
        })
      })
    })

    describe('upgrade', function () {
      beforeEach(async function () {
        await this.zeroVersionDirectory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
        const { receipt } = await this.app.create(contract)
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)

        // set new version
        await this.package.addVersion(version_1, this.firstVersionDirectory.address, { from: packageOwner })
        await this.app.setVersion(version_1, { from: appOwner })
      })

      describe('when the sender is the app owner', function () {
        const from = appOwner

        describe('when the requested contract was registered for the new version', function () {
          beforeEach(async function () {
            await this.firstVersionDirectory.setImplementation(contract, this.implementation_v1, { from: directoryOwner })
          })

          it('upgrades to the requested implementation', async function () {
            await this.app.upgrade(this.proxyAddress, contract, { from })

            const implementation = await this.app.getProxyImplementation(this.proxy.address)
            assert.equal(implementation, this.implementation_v1)
          })
        })

        describe('when the requested contract was not registered for the new version', function () {
          it('reverts', async function () {
            await assertRevert(this.app.upgrade(this.proxyAddress, contract, { from }))
          })
        })
      })

      describe('when the sender is not the app owner', function () {
        const from = anotherAccount

        it('reverts', async function () {
          await this.firstVersionDirectory.setImplementation(contract, this.implementation_v1, { from: directoryOwner })
          await assertRevert(this.app.upgrade(this.proxyAddress, contract, { from }))
        })
      })
    })

    describe('upgradeAndCall', function () {
      const initializeData = encodeCall('initialize', ['uint256'], [42])

      beforeEach(async function () {
        await this.zeroVersionDirectory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })
        const { receipt } = await this.app.create(contract)
        this.logs = decodeLogs(receipt.logs, UpgradeabilityProxyFactory)
        this.proxyAddress = this.logs.find(l => l.event === 'ProxyCreated').args.proxy
        this.proxy = await AdminUpgradeabilityProxy.at(this.proxyAddress)
        this.behavior = await MigratableMock.new()

        // set new version
        await this.package.addVersion(version_1, this.firstVersionDirectory.address, { from: packageOwner })
        await this.app.setVersion(version_1, { from: appOwner })
      })

      describe('when the sender is the app owner', function () {
        const from = appOwner
        const value = 1e5

        describe('when the requested contract was registered for the new version', function () {
          beforeEach(async function () {
            await this.firstVersionDirectory.setImplementation(contract, this.behavior.address, { from: directoryOwner })
            await this.app.upgradeAndCall(this.proxyAddress, contract, initializeData, { from, value })
          })

          it('upgrades to the requested implementation', async function () {
            const implementation = await this.app.getProxyImplementation(this.proxy.address)
            assert.equal(implementation, this.behavior.address)
          })

          it('calls the "initialize" function', async function() {
            const initializable = MigratableMock.at(this.proxyAddress)
            const x = await initializable.x()
            assert.equal(x, 42)
          })

          it('sends given value to the delegated implementation', async function() {
            const balance = await web3.eth.getBalance(this.proxyAddress)
            assert(balance.eq(value))
          })

          it('uses the storage of the proxy', async function () {
            // fetch the x value of Migratable at position 0 of the storage
            const storedValue = await web3.eth.getStorageAt(this.proxyAddress, 1)
            assert.equal(storedValue, 42)
          })
        })

        describe('when the requested contract was not registered for the new version', function () {
          it('reverts', async function () {
            await assertRevert(this.app.upgradeAndCall(this.proxyAddress, contract, initializeData, { from, value }))
          })
        })
      })

      describe('when the sender is not the app owner', function () {
        const from = anotherAccount

        it('reverts', async function () {
          await this.firstVersionDirectory.setImplementation(contract, this.behavior.address, { from: directoryOwner })
          await assertRevert(this.app.upgradeAndCall(this.proxyAddress, contract, initializeData, { from }))
        })
      })
    })

    describe('getImplementation', function () {
      describe('when using the directory of the first version', function () {
        it('fetches the implementation of the contract registered in the zero directory', async function () {
          await this.zeroVersionDirectory.setImplementation(contract, this.implementation_v0, { from: directoryOwner })

          const implementation = await this.app.getImplementation(contract)
          assert.equal(implementation, this.implementation_v0)
        })
      })

      describe('when using the directory of the first version', function () {
        beforeEach(async function () {
          await this.package.addVersion(version_1, this.firstVersionDirectory.address, { from: packageOwner })
          await this.app.setVersion(version_1, { from: appOwner })
        })

        it('fetches the implementation of the contract registered in the first directory', async function () {
          await this.firstVersionDirectory.setImplementation(contract, this.implementation_v1, { from: directoryOwner })

          const implementation = await this.app.getImplementation(contract)
          assert.equal(implementation, this.implementation_v1)
        })
      })
    })
  })
})
