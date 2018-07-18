import Truffle from '../models/truffle/Truffle';
import Session from '../models/network/Session'
import Contracts from 'zos-lib/lib/utils/Contracts';
import _ from 'lodash';

const DEFAULT_TIMEOUT = 10 * 60; // 10 minutes

export default async function runWithTruffle(script, options) {
  const config = Truffle.config()
  const { network, from, timeout } = Session.getOptions(options)
  const txParams = from ? { from } : {}

  if (!network) throw Error('A network name must be provided to execute the requested action.')
  config.network = network
  Contracts.setSyncTimeout((_.isNil(timeout) ? DEFAULT_TIMEOUT : timeout) * 1000)
  if (options.compile) await Truffle.compile(config)
  initTruffle(config).then(() => script({ network, txParams }))
}

function initTruffle(config) {
  return new Promise((resolve, reject) => {
    const TruffleEnvironment = require('truffle-core/lib/environment')
    TruffleEnvironment.detect(config, function (error) {
      if (error) reject(error)
      const Web3 = require('web3')
      global.web3 = new Web3(config.provider)
      global.artifacts = config.resolver
      resolve()
    })
  });
}

module.exports.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;