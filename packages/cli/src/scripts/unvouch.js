import { KernelProvider } from 'zos-kernel'

export default async function unvouch({ releaseAddress, rawAmount, network, txParams = {} }) {
  if(!releaseAddress) throw Error('The release address to unvouch from must be provided.')
  if(!rawAmount) throw Error('The amount of ZEP tokens to be unvouched must be provided.')

  const data = ''
  const amount = new web3.BigNumber(rawAmount)
  const kernel = await KernelProvider.fromKernelNetworkFile(network, txParams)
  await kernel.validateCanUnvouch(releaseAddress, amount)
  await kernel.unvouch(releaseAddress, amount, data)
}
