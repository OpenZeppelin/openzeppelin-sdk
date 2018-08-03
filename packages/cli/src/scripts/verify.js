import ControllerFor from '../models/network/ControllerFor'

export default async function verify(contractAlias, { network = 'mainnet', txParams = {}, networkFile = undefined, optimizer = false, optimizerRuns = 200, remote = 'etherchain' }) {
  const controller = ControllerFor(network, txParams, networkFile)
  controller.checkLocalContractDeployed(contractAlias, true)
  await controller.verifyAndPublishContract(contractAlias, optimizer, optimizerRuns, remote)
}
