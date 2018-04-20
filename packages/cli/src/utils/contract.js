const truffleContract = require("truffle-contract")
const truffleProvision = require("truffle-provisioner")

function getDefaults() {
  if (typeof(artifacts) !== 'undefined') {
    return artifacts.options
  } else {
    throw "Could not retrieve truffle defaults"
  }
}

module.exports = function(contractOrName) {
  // TODO: Consider sourcing from node_modules so we don't need to import and compile these contracts in this project
  const data = typeof(contractOrName) === 'string'
    ? require(`../../build/contracts/${contractOrName}.json`)
    : contractOrName;
  const contract = truffleContract(data)

  // Truffle injects entirely different objects in testing and in exec, hence this if
  if (process.env.NODE_ENV === 'test') {
    contract.setProvider(web3.currentProvider)
    contract.defaults({gas: 6721975, gasPrice: 100000000000, from: web3.eth.accounts[0] })
  } else {
    truffleProvision(contract, getDefaults())
  }
  
  return contract
}