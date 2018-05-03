import assertRevert from '../../../src/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../src/test/behaviors/Ownable'

const Package = artifacts.require('Package')
const ContractDirectory = artifacts.require('ContractDirectory')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('Package', ([_, owner, anotherAddress]) => {
  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.package = await Package.new({ from: owner })
    this.directory_V0 = await ContractDirectory.new({ from: owner })
    this.directory_V1 = await ContractDirectory.new({ from: owner })
  })

  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.package
    })

    shouldBehaveLikeOwnable(owner, anotherAddress)
  })

  describe('addVersion', function () {
    const version = '0'

    describe('when the sender is the owner of the contract', function () {
      const from = owner

      describe('when the given version was not set', function () {
        it('registers given contract directory', async function () {
          await this.package.addVersion(version, this.directory_V0.address, { from })

          const registeredDirectory = await this.package.getVersion(version)
          assert.equal(registeredDirectory, this.directory_V0.address)
        })

        it('emits an event', async function () {
          const { logs } = await this.package.addVersion(version, this.directory_V0.address, { from })

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'VersionAdded')
          assert.equal(logs[0].args.version, version)
          assert.equal(logs[0].args.provider, this.directory_V0.address)
        })
      })

      describe('when the given version was already set', function () {
        const anotherVersion = '1'

        it('reverts', async function () {
          await this.package.addVersion(version, this.directory_V0.address, { from })
          await assertRevert(this.package.addVersion(version, this.directory_V1.address, { from }))
        })

        it('can register another version', async function () {
          await this.package.addVersion(anotherVersion, this.directory_V1.address, { from })

          const newRegisteredDirectory = await this.package.getVersion(anotherVersion)
          assert.equal(newRegisteredDirectory, this.directory_V1.address)
        })

        it('emits another event', async function () {
          const { logs } = await this.package.addVersion(anotherVersion, this.directory_V1.address, { from })

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'VersionAdded')
          assert.equal(logs[0].args.version, anotherVersion)
          assert.equal(logs[0].args.provider, this.directory_V1.address)
        })
      })
    })

    describe('when the sender is not the owner of the contract', function () {
      const from = anotherAddress

      it('reverts', async function () {
        await assertRevert(this.package.addVersion(version, this.directory_V0.address, { from }))
      })
    })
  })

  describe('getVersion', function () {
    const version = '0'

    describe('when the requested version was set', function () {
      beforeEach(async function () {
        await this.package.addVersion(version, this.directory_V0.address, { from: owner })
      })

      it('returns the registered directory', async function () {
        const registeredDirectory = await this.package.getVersion(version)
        assert.equal(registeredDirectory, this.directory_V0.address)
      })
    })

    describe('when the requested version was not set', function () {
      it('reverts', async function () {
        await assertRevert(this.package.getVersion(version))
      })
    })
  })

  describe('hasVersion', function () {
    const version = '0'

    describe('when the requested version was set', function () {
      beforeEach(async function () {
        await this.package.addVersion(version, this.directory_V0.address, { from: owner })
      })

      it('returns true', async function () {
        const hasVersion = await this.package.hasVersion(version)
        assert.isTrue(hasVersion)
      })
    })

    describe('when the requested version was not set', function () {
      it('returns the zero address', async function () {
        const hasVersion = await this.package.hasVersion(version)
        assert.isFalse(hasVersion)
      })
    })
  })

  describe('getImplementation', function () {
    const version = '0'
    const contractName = 'ERC721'

    describe('when the requested version was set', function () {
      beforeEach(async function () {
        await this.package.addVersion(version, this.directory_V0.address, { from: owner })
      })

      describe('when the requested version holds the requested contract name', function () {
        beforeEach(async function () {
          await this.directory_V0.setImplementation(contractName, this.implementation_v0, { from: owner })
        })

        it('returns the requested implementation', async function () {
          const implementation = await this.package.getImplementation(version, contractName)
          assert.equal(implementation, this.implementation_v0)
        })
      })

      describe('when the requested version does not hold the requested contract name', function () {
        it('returns the zero address', async function () {
          const implementation = await this.package.getImplementation(version, contractName)
          assert.equal(implementation, 0x0)
        })
      })
    })

    describe('when the requested version was not set', function () {
      it('reverts', async function () {
        await assertRevert(this.package.getImplementation(version, contractName))
      })
    })
  })
})
