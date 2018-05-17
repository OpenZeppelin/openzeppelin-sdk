'use strict';
require('../../setup')

import assertRevert from '../../../src/test/helpers/assertRevert'
import shouldBehaveLikeImplementationDirectory from '../../../src/test/behaviors/ImplementationDirectory'

const AppDirectory = artifacts.require('AppDirectory')
const ImplementationDirectory = artifacts.require('ImplementationDirectory')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('AppDirectory', ([_, owner, stdlibOwner, anotherAddress]) => {
  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
    this.stdlibImplementation = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.directory = await AppDirectory.new(0x0, { from: owner })
    this.stdlib = await ImplementationDirectory.new({ from: stdlibOwner })
  })

  shouldBehaveLikeImplementationDirectory(owner, anotherAddress)

  describe('getImplementation', function () {
    const contractName = 'ERC721'

    describe('when no stdlib was set', function () {
      describe('when the requested contract was registered in the directory', function () {
        beforeEach(async function () {
          await this.directory.setImplementation(contractName, this.implementation_v0, { from: owner })
        })

        it('returns the directory implementation', async function () {
          const implementation = await this.directory.getImplementation(contractName)
          implementation.should.be.equal(this.implementation_v0)
        })
      })

      describe('when the requested contract was not registered in the directory', function () {
        it('returns the zero address', async function () {
          const implementation = await this.directory.getImplementation(contractName)
          implementation.should.be.zeroAddress
        })
      })
    })

    describe('when a stdlib was set', function () {
      beforeEach(async function () {
        await this.directory.setStdlib(this.stdlib.address, { from: owner })
      })

      describe('when the requested contract was registered in the directory', function () {
        beforeEach(async function () {
          await this.directory.setImplementation(contractName, this.implementation_v0, { from: owner })
        })

        describe('when the requested contract was registered in the stdlib', function () {
          beforeEach(async function () {
            await this.stdlib.setImplementation(contractName, this.stdlibImplementation, { from: stdlibOwner })
          })

          it('returns the directory implementation', async function () {
            const implementation = await this.directory.getImplementation(contractName)
            implementation.should.be.equal(this.implementation_v0)
          })
        })

        describe('when the requested contract was not registered in the stdlib', function () {
          it('returns the directory implementation', async function () {
            const implementation = await this.directory.getImplementation(contractName)
            implementation.should.be.equal(this.implementation_v0)
          })
        })
      })

      describe('when the requested contract was not registered in the directory', function () {
        describe('when the requested contract was registered in the stdlib', function () {
          beforeEach(async function () {
            await this.stdlib.setImplementation(contractName, this.stdlibImplementation, { from: stdlibOwner })
          })

          it('returns the stdlib implementation', async function () {
            const implementation = await this.directory.getImplementation(contractName)
            implementation.should.be.equal(this.stdlibImplementation)
          })
        })

        describe('when the requested contract was not registered in the stdlib', function () {
          it('returns the zero address', async function () {
            const implementation = await this.directory.getImplementation(contractName)
            implementation.should.be.zeroAddress
          })
        })
      })
    })
  })

  describe('setStdlib', function () {
    describe('when the sender is the owner', function () {
      const from = owner

      beforeEach(async function () {
        await this.directory.setStdlib(this.stdlib.address, { from })
      })

      it('can set a new stdlib', async function () {
        const stdlib = await this.directory.stdlib()
        stdlib.should.be.equal(this.stdlib.address)
      })

      it('can reset a stdlib', async function () {
        const anotherStdlib = await ImplementationDirectory.new({ from: stdlibOwner })
        await this.directory.setStdlib(anotherStdlib.address, { from })

        const stdlib = await this.directory.stdlib()
        stdlib.should.be.equal(anotherStdlib.address)
      })

      it('can unset a stdlib', async function () {
        await this.directory.setStdlib(0, { from })
        const stdlib = await this.directory.stdlib()
        stdlib.should.be.zeroAddress
      })
    })

    describe('when the sender is not the owner', function () {
      it('reverts', async function () {
        await assertRevert(this.directory.setStdlib(this.stdlib.address, { from: anotherAddress }))
      })
    })
  })
})
