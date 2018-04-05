const Registry = artifacts.require('Registry')
const assertRevert = require('./helpers/assertRevert')
const shouldBehaveLikeOwnable = require('./ownership/Ownable.behavior')

contract('Registry', ([_, owner, anotherAddress, implementation_v0, implementation_v1]) => {
  beforeEach(async function () {
    this.registry = await Registry.new({ from: owner })
  })

  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.registry
    })

    shouldBehaveLikeOwnable(owner, anotherAddress)
  })

  describe('addImplementation', function () {
    describe('when the sender is the registry owner', function () {
      const from = owner

      describe('when the given contract version was not registered', function () {
        const version = '0'
        const contract = 'ERC721'

        describe('when the given address is not the zero address', function () {
          const implementation = implementation_v0;

          it('registers the given version', async function () {
            await this.registry.addImplementation(version, contract, implementation, { from })

            const registeredImplementation = await this.registry.getImplementation(version, contract)
            assert.equal(registeredImplementation, implementation)
          })

          it('emits an event', async function () {
            const { logs } = await this.registry.addImplementation(version, contract, implementation, { from })

            assert.equal(logs.length, 1)
            assert.equal(logs[0].event, 'ImplementationAdded')
            assert.equal(logs[0].args.version, version)
            assert.equal(logs[0].args.contractName, contract)
            assert.equal(logs[0].args.implementation, implementation)
          })

          it('allows to register a another version of the contract', async function () {
            const anotherVersion = '1'
            const anotherImplementation = implementation_v1

            await this.registry.addImplementation(version, contract, implementation, { from })
            await this.registry.addImplementation(anotherVersion, contract, anotherImplementation, { from })

            const registeredImplementation = await this.registry.getImplementation(version, contract)
            assert.equal(registeredImplementation, implementation)

            const newRegisteredImplementation = await this.registry.getImplementation(anotherVersion, contract)
            assert.equal(newRegisteredImplementation, anotherImplementation)
          })

          it('allows to register a another contract for the same version', async function () {
            const erc20 = 'ERC20'
            const erc20Implementation = implementation_v1

            await this.registry.addImplementation(version, contract, implementation, { from })
            await this.registry.addImplementation(version, erc20, erc20Implementation, { from })

            const registeredImplementation = await this.registry.getImplementation(version, contract)
            assert.equal(registeredImplementation, implementation)

            const anotherRegisteredImplementation = await this.registry.getImplementation(version, erc20)
            assert.equal(anotherRegisteredImplementation, erc20Implementation)
          })
        })

        describe('when the given address is the zero address', function () {
          const implementation = 0x0;

          it('reverts', async function () {
            await assertRevert(this.registry.addImplementation(version, contract, implementation, { from }))
          })
        })
      })

      describe('when the given contract version was already registered', function () {
        const version = '0'
        const contract = 'ERC721'

        beforeEach(async function () {
          await this.registry.addImplementation(version, contract, implementation_v0, { from })
        })

        describe('when the given address is not the zero address', function () {
          const implementation = implementation_v0;

          it('reverts', async function () {
            await assertRevert(this.registry.addImplementation(version, contract, implementation, { from }))
          })

          it('allows to register a another version', async function () {
            const anotherVersion = '1'
            const anotherImplementation = implementation_v1

            await this.registry.addImplementation(anotherVersion, contract, anotherImplementation, { from })

            const registeredImplementation = await this.registry.getImplementation(version, contract)
            assert.equal(registeredImplementation, implementation)

            const newRegisteredImplementation = await this.registry.getImplementation(anotherVersion, contract)
            assert.equal(newRegisteredImplementation, anotherImplementation)
          })
        })

        describe('when the given address is the zero address', function () {
          const implementation = 0x0;

          it('reverts', async function () {
            await assertRevert(this.registry.addImplementation(version, contract, implementation, { from }))
          })
        })
      })
    })
  })

  describe('when the sender is the registry owner', function () {
    const from = anotherAddress

    it('reverts', async function () {
      await assertRevert(this.registry.addImplementation('0', 'ERC721', implementation_v0, { from }))
    })
  })
})
