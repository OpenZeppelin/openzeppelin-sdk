import { ZWeb3, Contracts } from 'zos-lib'
import Session from '../network/Session'
import TruffleConfig from './truffle/TruffleConfig'

export default {
  async call(options) {
    const { network, from, timeout } = Session.getOptions(options)
    if (!network) throw Error('A network name must be provided to execute the requested action.')

    // this line could be expanded to support different libraries like embark, ethjs, buidler, etc
    const { provider, buildDir, artifactDefaults } = TruffleConfig.load(network)

    ZWeb3.initialize(provider)
    Contracts.setSyncTimeout(timeout * 1000)
    Contracts.setLocalBuildDir(buildDir)
    Contracts.setArtifactsDefaults(artifactDefaults)

    const txParams = from ? { from } : { from: await ZWeb3.defaultAccount() }
    return { network: await ZWeb3.getNetworkName(), txParams }
  }
}
