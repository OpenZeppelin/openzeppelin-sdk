import { KernelProvider } from 'zos-kernel'

export default async function vouch({ releaseAddress, rawAmount, network, txParams = {} }) {
  if(!releaseAddress) throw Error('The release address to vouch for must be provided.')
  if(!rawAmount) throw Error('The amount of ZEP tokens to be vouched must be provided.')

  const data = ''
  const amount = new web3.BigNumber(rawAmount)
  const kernel = await KernelProvider.fromKernelNetworkFile(network, txParams)
  await kernel.validateCanVouch(releaseAddress, amount)
  await kernel.vouch(releaseAddress, amount, data)
}
