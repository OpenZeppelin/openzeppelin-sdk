import { Logger } from 'zos-lib'
import truffleContract from 'truffle-contract'
import ContractsProvider from 'zos-lib/lib/utils/ContractsProvider'

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

  global.ContractsProvider = ContractsProvider
}
