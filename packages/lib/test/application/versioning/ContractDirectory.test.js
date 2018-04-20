const ContractDirectory = artifacts.require('ContractDirectory')
const shouldBehaveLikeContractDirectory = require('./ContractDirectory.behavior')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('ContractDirectory', ([_, owner, anotherAddress]) => {
  before(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
  })

  beforeEach(async function () {
    this.directory = await ContractDirectory.new({ from: owner })
  })

  shouldBehaveLikeContractDirectory(owner, anotherAddress, this.implementation_v0, this.implementation_v1)
})
