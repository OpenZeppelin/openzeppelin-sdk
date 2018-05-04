import { Logger } from 'zos-lib'
import Stdlib from '../../src/models/stdlib/Stdlib'
import truffleContract from 'truffle-contract'
import StdlibInstaller from '../../src/models/stdlib/StdlibInstaller'
import ContractsProvider from '../../src/utils/ContractsProvider'

const DEFAULT_TX_PARAMS = {
  gas: 6721975,
  gasPrice: 100000000000,
  from: web3.eth.accounts[0]
}

muteLogging()
doNotInstallStdlib()
provideContractsFromTruffle()

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}

function doNotInstallStdlib() {
  StdlibInstaller.call = stdlibNameAndVersion => new Stdlib(stdlibNameAndVersion)
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
