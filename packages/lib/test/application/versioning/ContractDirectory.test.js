import shouldBehaveLikeContractDirectory from './ContractDirectory.behavior'

const ContractDirectory = artifacts.require('ContractDirectory')
const DummyImplementation = artifacts.require('DummyImplementation')

contract('ContractDirectory', function([_, owner, anotherAddress]) {
  beforeEach(async function () {
    this.implementation_v0 = (await DummyImplementation.new()).address
    this.implementation_v1 = (await DummyImplementation.new()).address
    this.directory = await ContractDirectory.new({ from: owner })
  })

  shouldBehaveLikeContractDirectory(owner, anotherAddress)
})
