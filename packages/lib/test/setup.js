import Logger from '../src/utils/Logger'
import truffleContract from 'truffle-contract'
import ContractsProvider from '../src/utils/ContractsProvider'

const DEFAULT_TX_PARAMS = {
  gas: 6721975,
  gasPrice: 100000000000,
  from: web3.eth.accounts[0]
}

muteLogging()
provideContractsFromTruffle()

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}

function provideContractsFromTruffle() {
  ContractsProvider.getByJSONData = (data) => {
    const contract = truffleContract(data)
    contract.setProvider(web3.currentProvider)
    contract.defaults(DEFAULT_TX_PARAMS)
    return contract
  }

  ContractsProvider.getFromKernel = contractName => {
    const data = require(`zos-kernel/build/contracts/${contractName}.json`);
    return ContractsProvider.getByJSONData(data)
  }

  global.ContractsProvider = ContractsProvider
}
