'use strict';
require('../../../setup')

import Contracts from '../../../../src/utils/Contracts'
import assertRevert from '../../../../src/test/helpers/assertRevert'
import shouldBehaveLikeOwnable from '../../../../src/test/behaviors/Ownable'

const DummyImplementation = Contracts.getFromLocal('DummyImplementation')
const ImplementationDirectory = Contracts.getFromLocal('ImplementationDirectory')

contract('ImplementationDirectory', function([_, owner, anotherAddress]) {
  beforeEach(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
    this.directory = await ImplementationDirectory.new({ from: owner })
  })

  describe('ownership', function () {
    beforeEach(function () {
      this.ownable = this.directory
    })
    shouldBehaveLikeOwnable(owner, anotherAddress)
  })

  describe('setImplementation', function () {
    const contractName = 'ERC721'

    describe('when the sender is the directory owner', function () {
      const from = owner

      describe('when registering a contract', function () {
        beforeEach('registering the contract', async function () {
          const { logs } = await this.directory.setImplementation(contractName, this.implementation_v0, { from })
          this.logs = logs
        })

        it('can be retrieved afterwards', async function () {
          const registeredImplementation = await this.directory.getImplementation(contractName)
          assert.equal(registeredImplementation, this.implementation_v0)
        })

        it('emits an event', async function () {
          assert.equal(this.logs.length, 1)
          assert.equal(this.logs[0].event, 'ImplementationChanged')
          assert.equal(this.logs[0].args.contractName, contractName)
          assert.equal(this.logs[0].args.implementation, this.implementation_v0)
        })

        it('allows to register another implementation of the same contract', async function () {
          await this.directory.setImplementation(contractName, this.implementation_v1, { from })

          const registeredImplementation = await this.directory.getImplementation(contractName)
          assert.equal(registeredImplementation, this.implementation_v1)
        })

        it('allows to register another contract', async function () {
          const anotherContract = 'anotherContract';
          await this.directory.setImplementation(anotherContract, this.implementation_v1, { from })

          const registeredImplementation = await this.directory.getImplementation(anotherContract)
          assert.equal(registeredImplementation, this.implementation_v1)
        })
      })

      describe('when registering an address that is not a contract', function () {
        it('reverts', async function () {
          await assertRevert(this.directory.setImplementation(contractName, anotherAddress, { from }))
        })
      })
    })

    describe('when the sender is not the directory owner', function () {
      const from = anotherAddress

      it('cannot register contract', async function () {
        await assertRevert(this.directory.setImplementation(contractName, this.implementation_v0, { from }))
      })
    })
  })

  describe('unsetImplementation', function () {
    const ZERO_ADDRESS = 0x0
    const contractName = 'ERC721'

    beforeEach('registering the contract', async function () {
      await this.directory.setImplementation(contractName, this.implementation_v0, { from: owner })
    })

    describe('when the sender is the directory owner', function () {
      const from = owner

      beforeEach('unregistering the contract', async function () {
        const { logs } = await this.directory.unsetImplementation(contractName, { from })
        this.logs = logs
      })

      it('cannot be retrieved afterwards', async function () {
        const registeredImplementation = await this.directory.getImplementation(contractName)
        assert.equal(registeredImplementation, ZERO_ADDRESS)
      })

      it('emits an event', async function () {
        assert.equal(this.logs.length, 1)
        assert.equal(this.logs[0].event, 'ImplementationChanged')
        assert.equal(this.logs[0].args.contractName, contractName)
        assert.equal(this.logs[0].args.implementation, ZERO_ADDRESS)
      })
    })

    describe('when the sender is not the directory owner', function () {
      const from = anotherAddress

      it('cannot unregister contract', async function () {
        await assertRevert(this.directory.unsetImplementation(contractName, { from }))
      })
    })
  })

  describe('freeze', function () {
    it('starts unfrozen', async function () {
      const frozen = await this.directory.frozen()
      frozen.should.be.false
    })
    
    describe('when the sender is the owner', function () {
      const from  = owner

      describe('when it is not frozen', function () {
        it('can be frozen', async function () {
          await this.directory.freeze({ from })
          const frozen = await this.directory.frozen()
          frozen.should.be.true
        })
      })

      describe('when it is frozen', function () {
        beforeEach(async function () {
          await this.directory.freeze({ from })
        })

        it('cannot be re-frozen', async function () {
          await assertRevert(this.directory.freeze({ from }))
        })
      })
    })

    describe('when the sender is not the owner', function () {
      const from = anotherAddress

      it('reverts', async function () {
        await assertRevert(this.directory.freeze({ from }))
      })
    })
  })

  describe('set/unset implementation', function () {
    describe('when it is frozen', function () {
      beforeEach(async function () {
        await this.directory.freeze({ from: owner })
      })

      it('does not allow to set implementation', async function () {
        await assertRevert(this.directory.setImplementation('ERC721', this.implementation_v1, { from: owner }))
      })

      it('does not allow to unset implementation', async function () {
        await assertRevert(this.directory.unsetImplementation('ERC721', { from: owner }))
      })
    })
  })
})
