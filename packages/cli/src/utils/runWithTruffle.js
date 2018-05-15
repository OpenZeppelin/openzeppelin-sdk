import Web3 from 'web3'
import TruffleConfig from 'truffle-config'
import TruffleCompile from 'truffle-workflow-compile'
import TruffleEnvironment from 'truffle-core/lib/environment'
import ContractsProvider from './ContractsProvider'
import { Logger } from 'zos-lib'

const log = new Logger('RunWithTruffle')
const options = { logger: console }
const config = TruffleConfig.detect(options)

function initTruffle(network) {
  if(!network) throw Error('A network name must be provided to execute the requested action.')
  config.network = network
  return new Promise((resolve, reject) => {
    TruffleEnvironment.detect(config, function (error) {
      if (error) throw error
      global.web3 = new Web3(config.provider)
      global.artifacts = config.resolver
      global.ContractsProvider = ContractsProvider
      resolve()
    })
  });
}

function compileWithTruffle() {
  log.info("Compiling contracts with truffle")

  const truffleCallback = (err, abstractions, paths) => {
    if (err) log.error(err)
  }

  TruffleCompile.compile(config, truffleCallback)
}

export default function runWithTruffle(script, network, compile = false) {
  if (compile) compileWithTruffle()
  initTruffle(network).then(script)
}
