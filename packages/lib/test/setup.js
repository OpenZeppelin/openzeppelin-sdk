'use strict';

import Logger from '../src/utils/Logger'
import truffleContract from 'truffle-contract'
import Contracts from '../src/utils/Contracts'

const DEFAULT_TX_PARAMS = {
  gas: 6721975,
  gasPrice: 100000000000,
  from: web3.eth.accounts[0]
}

function muteLogging() {
  Logger.prototype.info = msg => {}
  Logger.prototype.error = msg => {}
}

function provideContractsFromTruffle() {
  // need to do this because truffle gets contract
  // instances differently in test and production environments
  Contracts.getByJSONData = (data) => {
    const contract = truffleContract(data)
    contract.setProvider(web3.currentProvider)
    contract.defaults(DEFAULT_TX_PARAMS)
    return contract
  }

  global.Contracts = Contracts
}

muteLogging()
provideContractsFromTruffle()

