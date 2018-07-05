'use strict'
require('../setup')

import Stdlib from '../../src/models/stdlib/Stdlib'

const should = require('chai').should()

contract('Stdlib', function () {
  const packageName = 'mock-stdlib'

  describe('fetch', function () {
    describe('when there is a network file for the requested network', function () {
      const network = 'test'

      describe('when the given version matches the stdlib package one', function () {
        const version = '1.1.0'

        it('should return the address of the stdlib', function () {
          Stdlib.fetch(packageName, version, network).address.should.be.nonzeroAddress
        })
      })

      describe('when the given version does not match the stdlib package one', function () {
        const version = '2.0.0'

        it('throws an error', function () {
          expect(() => Stdlib.fetch(packageName, version, network))
            .to.throw('Required stdlib version 2.0.0 does not match stdlib package version 1.1.0')
        })
      })
    })

    describe('when there is no network file for the requested network', function () {
      const network = 'cosmos'
      const version = '1.1.0'

      it('throws an error', function () {
        expect(() => Stdlib.fetch(packageName, version, network))
          .to.throw('Could not find a zos file for network \'cosmos\' for the requested stdlib mock-stdlib@1.1.0. Please make sure it is provided or at least self-deployed if you are in development mode.')
      })
    })
  })

  describe('stdlib', function () {
    const greeterName = 'Greeter'

    beforeEach('initializing stdlib', async function () {
      this.stdlib = new Stdlib(packageName)
    })

    it('should set a name', async function () {
      this.stdlib.name.should.eq(packageName)
    })

    it('should set latest version with caret if not specified', async function () {
      this.stdlib.version.should.eq('^1.1.0')
    })

    it('should list all provided contracts', async function () {
      Object.keys(this.stdlib.contracts()).should.have.members([greeterName])
    })

    it('should tell if it has a contract', async function () {
      this.stdlib.hasContract(greeterName).should.be.true
      this.stdlib.hasContract('anotherContract').should.be.false
    })

    it('should retrieve a contract name', async function () {
      this.stdlib.contract(greeterName).should.be.equal('GreeterImpl')
    })
  })
})
