import { ZWeb3, Contracts } from 'zos-lib'
import Session from '../network/Session'
import Compiler from '../compiler/Compiler'
import TruffleConfig from './truffle/TruffleConfig'

const ConfigVariablesInitializer = {
  initStaticConfiguration() {
    const buildDir = TruffleConfig.buildDir()
    Contracts.setLocalBuildDir(buildDir)
    const solcSettings = TruffleConfig.solcSettings()
    Compiler.setSettings(solcSettings)
  },

  async initNetworkConfiguration(options) {
    const { network, from, timeout } = Session.getOptions(options)
    if (!network) throw Error('A network name must be provided to execute the requested action.')

    // this line could be expanded to support different libraries like embark, ethjs, buidler, etc
    const { provider, buildDir, artifactDefaults } = TruffleConfig.loadProviderAndDefaults(network)

    ZWeb3.initialize(provider)
    Contracts.setSyncTimeout(timeout * 1000)
    Contracts.setLocalBuildDir(buildDir)
    Contracts.setArtifactsDefaults(artifactDefaults)

    const txParams = from ? { from } : { from: await ZWeb3.defaultAccount() }
    return { network: await ZWeb3.getNetworkName(), txParams }
  }
}

export default ConfigVariablesInitializer