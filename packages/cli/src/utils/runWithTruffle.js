import Web3 from 'web3'
import TruffleConfig from 'truffle-config'
import TruffleEnvironment from 'truffle-core/lib/environment'
import ContractsProvider from './ContractsProvider'

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
