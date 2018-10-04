import Truffle from '../models/truffle/Truffle';
import Session from '../models/network/Session'
import Contracts from 'zos-lib/lib/utils/Contracts';
import _ from 'lodash';

const DEFAULT_TIMEOUT = 10 * 60; // 10 minutes

export default async function runWithTruffle(script, options) {
  const config = Truffle.config()
  const { networks: networkList } = config
  const { network, from, timeout } = Session.getOptions(options)
  const txParams = from ? { from: from.toLowerCase() } : {}

  if (!network) throw Error('A network name must be provided to execute the requested action.')
  config.network = network
  if (!from && networkList[network].from) networkList[network].from = networkList[network].from.toLowerCase()
  Contracts.setSyncTimeout((_.isNil(timeout) ? DEFAULT_TIMEOUT : timeout) * 1000)
  if (options.compile) await Truffle.compile(config)
  await initTruffle(config)
  await script({ network, txParams })
  if (!options.dontExitProcess) process.exit(0)
}

function initTruffle(config) {
  return new Promise((resolve, reject) => {
    const TruffleEnvironment = require('truffle-core/lib/environment')
    TruffleEnvironment.detect(config, function (error) {
      if (error) reject(error)
      const Web3 = require('web3')
      const { provider, resolver } = Truffle.setNonceTrackerIfNeeded(config)
      global.web3 = new Web3(provider)
      global.artifacts = resolver
      resolve()
    })
  });
}

module.exports.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;
