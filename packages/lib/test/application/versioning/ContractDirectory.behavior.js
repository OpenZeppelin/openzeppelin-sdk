const assertRevert = require('../../helpers/assertRevert')
const ContractDirectory = artifacts.require('ContractDirectory')
const shouldBehaveLikeOwnable = require('../../ownership/Ownable.behavior')

function shouldBehaveLikeContractDirectory(owner, anotherAddress, implementation_v0, implementation_v1) {
  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.directory
    })

    shouldBehaveLikeOwnable(owner, anotherAddress)
  })

  describe('setImplementation', function () {
    const ZERO_ADDRESS = 0x0
    const contractName = 'ERC721'

    describe('when the sender is the directory owner', function () {
      const from = owner

      it('registers the given contract', async function () {
        await this.directory.setImplementation(contractName, implementation_v0, { from })

        const registeredImplementation = await this.directory.getImplementation(contractName)
        assert.equal(registeredImplementation, implementation_v0)
      })

      it('emits an event', async function () {
        const { logs } = await this.directory.setImplementation(contractName, implementation_v0, { from })

        assert.equal(logs.length, 1)
        assert.equal(logs[0].event, 'ImplementationAdded')
        assert.equal(logs[0].args.contractName, contractName)
        assert.equal(logs[0].args.implementation, implementation_v0)
      })

      it('allows to register a another implementation of the same contract', async function () {
        await this.directory.setImplementation(contractName, implementation_v0, { from })
        await this.directory.setImplementation(contractName, implementation_v1, { from })

        const registeredImplementation = await this.directory.getImplementation(contractName)
        assert.equal(registeredImplementation, implementation_v1)
      })

      it('allows to register another contract', async function () {
        const anotherContract = 'anotherContract';
        await this.directory.setImplementation(anotherContract, implementation_v1, { from })

        const registeredImplementation = await this.directory.getImplementation(anotherContract)
        assert.equal(registeredImplementation, implementation_v1)
      })

      it('allows to unregister a contract', async function () {
        await this.directory.setImplementation(contractName, implementation_v0, { from })
        await this.directory.setImplementation(contractName, ZERO_ADDRESS, { from })

        const registeredImplementation = await this.directory.getImplementation(contractName)
        assert.equal(registeredImplementation, ZERO_ADDRESS)
      })
    })

    describe('when the sender is not the directory owner', function () {
      const from = anotherAddress

      it('reverts', async function () {
        await assertRevert(this.directory.setImplementation(contractName, implementation_v0, { from }))
      })
    })
  })
}

module.exports = shouldBehaveLikeContractDirectory
