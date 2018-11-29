import { ZWeb3, Contracts } from 'zos-lib'
import Session from '../models/network/Session'
import TruffleConfig from '../models/truffle/TruffleConfig'

const DEFAULT_TIMEOUT = 10 * 60; // 10 minutes

export { DEFAULT_TIMEOUT }

export default async function runWithZWeb3(script, options) {
  const config = TruffleConfig.init()
  const { networks: networkList } = config
  const { network, from, timeout: sessionTimeout } = Session.getOptions(options)

  const txParams = from ? { from: from.toLowerCase() } : {}
  const timeout = ((sessionTimeout == null) ? DEFAULT_TIMEOUT : sessionTimeout) * 1000

  if (!network) throw Error('A network name must be provided to execute the requested action.')
  if (!networkList[network]) throw Error('Given network is not defined in your truffle-config file')

  config.network = network
  if (!from && networkList[network].from) networkList[network].from = networkList[network].from.toLowerCase()
  TruffleConfig.setNonceTrackerIfNeeded(config)

  const { provider, contracts_build_directory, resolver } = config

  ZWeb3.initialize(provider)
  Contracts.initialize(contracts_build_directory, timeout, resolver.options)

  await script({ network: await ZWeb3.getNetworkName(), txParams })
  if (!options.dontExitProcess) process.exit(0)
}
