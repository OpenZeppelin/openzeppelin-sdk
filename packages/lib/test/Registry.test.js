const Registry = artifacts.require('Registry')
const assertRevert = require('./helpers/assertRevert')

contract('Registry', ([_, owner, implementation_v0, implementation_v1]) => {
  beforeEach(async function () {
    this.registry = await Registry.new()
  })

  describe('addImplementation', function () {
    describe('when the given contract version was not registered', function () {
      const version = '0'
      const contract = 'ERC721'

      describe('when the given address is not the zero address', function () {
        const implementation = implementation_v0;

        it('registers the given version', async function () {
          await this.registry.addImplementation(version, contract, implementation)

          const registeredImplementation = await this.registry.getImplementation(version, contract)
          assert.equal(registeredImplementation, implementation)
        })

        it('emits an event', async function () {
          const { logs } = await this.registry.addImplementation(version, contract, implementation)

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'ImplementationAdded')
          assert.equal(logs[0].args.version, version)
          assert.equal(logs[0].args.contractName, contract)
          assert.equal(logs[0].args.implementation, implementation)
        })

        it('allows to register a another version of the contract', async function () {
          const anotherVersion = '1'
          const anotherImplementation = implementation_v1

          await this.registry.addImplementation(version, contract, implementation)
          await this.registry.addImplementation(anotherVersion, contract, anotherImplementation)

          const registeredImplementation = await this.registry.getImplementation(version, contract)
          assert.equal(registeredImplementation, implementation)

          const newRegisteredImplementation = await this.registry.getImplementation(anotherVersion, contract)
          assert.equal(newRegisteredImplementation, anotherImplementation)
        })

        it('allows to register a another contract for the same version', async function () {
          const erc20 = 'ERC20'
          const erc20Implementation = implementation_v1

          await this.registry.addImplementation(version, contract, implementation)
          await this.registry.addImplementation(version, erc20, erc20Implementation)

          const registeredImplementation = await this.registry.getImplementation(version, contract)
          assert.equal(registeredImplementation, implementation)

          const anotherRegisteredImplementation = await this.registry.getImplementation(version, erc20)
          assert.equal(anotherRegisteredImplementation, erc20Implementation)
        })
      })

      describe('when the given address is the zero address', function () {
        const implementation = 0x0;

        it('reverts', async function () {
          await assertRevert(this.registry.addImplementation(version, contract, implementation))
        })
      })
    })

    describe('when the given contract version was already registered', function () {
      const version = '0'
      const contract = 'ERC721'

      beforeEach(async function () {
        await this.registry.addImplementation(version, contract, implementation_v0)
      })

      describe('when the given address is not the zero address', function () {
        const implementation = implementation_v0;

        it('reverts', async function () {
          await assertRevert(this.registry.addImplementation(version, contract, implementation))
        })

        it('allows to register a another version', async function () {
          const anotherVersion = '1'
          const anotherImplementation = implementation_v1

          await this.registry.addImplementation(anotherVersion, contract, anotherImplementation)

          const registeredImplementation = await this.registry.getImplementation(version, contract)
          assert.equal(registeredImplementation, implementation)

          const newRegisteredImplementation = await this.registry.getImplementation(anotherVersion, contract)
          assert.equal(newRegisteredImplementation, anotherImplementation)
        })
      })

      describe('when the given address is the zero address', function () {
        const implementation = 0x0;

        it('reverts', async function () {
          await assertRevert(this.registry.addImplementation(version, contract, implementation))
        })
      })
    })
  })
})
