import { ZWeb3, Contracts } from 'zos-lib'
import Session from '../models/network/Session'
import TruffleConfig from '../models/truffle/TruffleConfig'

const DEFAULT_TIMEOUT = 10 * 60; // 10 minutes

export { DEFAULT_TIMEOUT }

export default async function runWithZWeb3(script, options) {
  const config = TruffleConfig.init()
  const txParams = resolveNetworkAndSender(config, options)
  await initZWeb3WithTruffleConfig(config, options)
  await script({ network: await ZWeb3.getNetworkName(), txParams })
  if (!options.dontExitProcess) process.exit(0)
}

function resolveNetworkAndSender(config, options) {
  const { networks: networkList } = config
  const { network, from } = Session.getOptions(options)

  if (!network) throw Error('A network name must be provided to execute the requested action.')
  if (!networkList[network]) throw Error('Given network is not defined in your truffle-config file')

  config.network = network
  if (!from && networkList[network].from) networkList[network].from = networkList[network].from.toLowerCase()
  return from ? { from: from.toLowerCase() } : {}
}

function initZWeb3WithTruffleConfig(config, options) {
  return new Promise((resolve, reject) => {
    const TruffleEnvironment = require('truffle-core/lib/environment')
    TruffleEnvironment.detect(config, function (error) {
      if (error) reject(error)
      else {
        TruffleConfig.setNonceTrackerIfNeeded(config)
        const { provider, contracts_build_directory, resolver } = config
        const { timeout: sessionTimeout } = Session.getOptions(options)
        const timeout = ((sessionTimeout == null) ? DEFAULT_TIMEOUT : sessionTimeout) * 1000
        ZWeb3.initialize(provider)
        Contracts.setSyncTimeout(timeout)
        Contracts.setLocalBuildDir(contracts_build_directory)
        Contracts.setArtifactsDefaults(resolver.options)
        resolve()
      }
    })
  })
}
