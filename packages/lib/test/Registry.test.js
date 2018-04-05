const Registry = artifacts.require('Registry')
const assertRevert = require('./helpers/assertRevert')

contract('Registry', ([_, owner, implementation_v0, implementation_v1]) => {
  beforeEach(async function () {
    this.registry = await Registry.new()
  })

  describe('addVersion', function () {
    describe('when the given version was not registered', function () {
      const version = '0'

      describe('when the given address is not the zero address', function () {
        const implementation = implementation_v0;

        it('registers the given version', async function () {
          await this.registry.addVersion(version, implementation)

          const registeredImplementation = await this.registry.getImplementation(version)
          assert.equal(registeredImplementation, implementation)
        })

        it('emits an event', async function () {
          const { logs } = await this.registry.addVersion(version, implementation)

          assert.equal(logs.length, 1)
          assert.equal(logs[0].event, 'VersionAdded')
          assert.equal(logs[0].args.version, version)
          assert.equal(logs[0].args.implementation, implementation)
        })

        it('allows to register a another version', async function () {
          const anotherVersion = '1'
          const anotherImplementation = implementation_v1

          await this.registry.addVersion(version, implementation)
          await this.registry.addVersion(anotherVersion, anotherImplementation)

          const registeredImplementation = await this.registry.getImplementation(version)
          assert.equal(registeredImplementation, implementation)

          const newRegisteredImplementation = await this.registry.getImplementation(anotherVersion)
          assert.equal(newRegisteredImplementation, anotherImplementation)
        })
      })

      describe('when the given address is the zero address', function () {
        const implementation = 0x0;

        it('reverts', async function () {
          await assertRevert(this.registry.addVersion(version, implementation))
        })
      })
    })

    describe('when the given version was already registered', function () {
      const version = '0'

      beforeEach(async function () {
        await this.registry.addVersion(version, implementation_v0)
      })

      describe('when the given address is not the zero address', function () {
        const implementation = implementation_v0;

        it('reverts', async function () {
          await assertRevert(this.registry.addVersion(version, implementation))
        })

        it('allows to register a another version', async function () {
          const anotherVersion = '1'
          const anotherImplementation = implementation_v1

          await this.registry.addVersion(anotherVersion, anotherImplementation)

          const registeredImplementation = await this.registry.getImplementation(version)
          assert.equal(registeredImplementation, implementation)

          const newRegisteredImplementation = await this.registry.getImplementation(anotherVersion)
          assert.equal(newRegisteredImplementation, anotherImplementation)
        })
      })

      describe('when the given address is the zero address', function () {
        const implementation = 0x0;

        it('reverts', async function () {
          await assertRevert(this.registry.addVersion(version, implementation))
        })
      })
    })
  })
})
