'use strict'
require('../setup')

import Stdlib from '../../src/models/stdlib/Stdlib'

contract('Stdlib', function () {
  const greeterName = 'Greeter'
  const packageName = 'mock-stdlib'

  beforeEach("initializing stdlib", async function () {
    this.stdlib = new Stdlib(packageName)
  })

  it('should set a name', async function () {
    this.stdlib.name.should.eq(packageName)
  })
  
  it('should set a version', async function () {
    this.stdlib.version.should.eq('1.1.0')
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
