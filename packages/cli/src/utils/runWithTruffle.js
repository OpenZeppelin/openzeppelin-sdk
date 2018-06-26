import Truffle from '../models/truffle/Truffle';
import { getNetwork as getSessionNetwork } from '../scripts/session';

export default async function runWithTruffle(script, network, compile = false) {
  const config = Truffle.config()

  network = network || getSessionNetwork();

  if(!network) throw Error('A network name must be provided to execute the requested action.')
  config.network = network
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
