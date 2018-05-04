const Web3 = require('web3')
const TruffleConfig = require("truffle-config");
const TruffleEnvironment = require("truffle-core/lib/environment");
const ContractsProvider = require('./ContractsProvider')

function initTruffle(network) {
  const options = { logger: console }
  const config = TruffleConfig.detect(options)
  config.network = network
  return new Promise((resolve, reject) => {
    TruffleEnvironment.detect(config, function (error) {
      if (error) throw error
      global.web3 = new Web3(config.provider)
      global.artifacts = config.resolver
      global.ContractsProvider = ContractsProvider
      resolve()
    })
  });
}

export default function runWithTruffle(script, network) {
  initTruffle(network).then(script)
}
