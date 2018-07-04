import Truffle from '../models/truffle/Truffle';
import Session from '../models/network/Session'
import Contracts from 'zos-lib/lib/utils/Contracts';
import _ from 'lodash';

const DEFAULT_TIMEOUT = 10 * 60; // 10 minutes

export default async function runWithTruffle(script, network, { compile = false, timeout = null }) {
  const config = Truffle.config()
  network = network || Session.getNetwork()

  if(!network) throw Error('A network name must be provided to execute the requested action.')
  config.network = network
  Contracts.setSyncTimeout((_.isNil(timeout) ? DEFAULT_TIMEOUT : timeout) * 1000)
  if (compile) await Truffle.compile(config)
  initTruffle(config).then(script)
}

function initTruffle(config) {
  return new Promise((resolve, reject) => {
    const TruffleEnvironment = require('truffle-core/lib/environment')
    TruffleEnvironment.detect(config, function (error) {
      if (error) throw error
      const Web3 = require('web3')
      global.web3 = new Web3(config.provider)
      global.artifacts = config.resolver
      resolve()
    })
  });
}
