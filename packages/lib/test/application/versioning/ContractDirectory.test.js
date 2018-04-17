const ContractDirectory = artifacts.require('ContractDirectory')
const shouldBehaveLikeContractDirectory = require('./ContractDirectory.behavior')

contract('ContractDirectory', ([_, owner, anotherAddress, implementation_v0, implementation_v1]) => {
  beforeEach(async function () {
    this.directory = await ContractDirectory.new({ from: owner })
  })

  shouldBehaveLikeContractDirectory(owner, anotherAddress, implementation_v0, implementation_v1)
})
