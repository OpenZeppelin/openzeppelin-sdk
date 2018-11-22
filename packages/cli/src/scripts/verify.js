import ControllerFor from '../models/network/ControllerFor'

export default async function verify(contractAlias, { network = 'mainnet', txParams = {}, networkFile = undefined, optimizer = false, optimizerRuns = 200, remote = 'etherchain', apiKey = undefined }) {
  if (remote === 'etherscan' && !apiKey) {
    throw new Error('Etherscan API key not specified. To get one, follow this link: https://etherscancom.freshdesk.com/support/solutions/articles/35000022163-i-need-an-api-key')
  }
  const controller = ControllerFor(network, txParams, networkFile)
  controller.checkLocalContractDeployed(contractAlias, true)
  await controller.verifyAndPublishContract(contractAlias, optimizer, optimizerRuns, remote, apiKey)
}
