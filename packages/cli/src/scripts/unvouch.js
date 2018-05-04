import { KernelProvider } from 'zos-kernel'

export default async function unvouch({ releaseAddress, rawAmount, network, txParams = {} }) {
  if(!releaseAddress) throw 'You must provide a release address to unvouch from'
  if(!rawAmount) throw 'You must provide an amount of ZEP tokens to unvouch'

  const data = ''
  const amount = new web3.BigNumber(rawAmount)
  const kernel = await KernelProvider.fromKernelNetworkFile(network, txParams)
  await kernel.validateCanUnvouch(releaseAddress, amount)

  try {
    await kernel.unvouch(releaseAddress, amount, data)
  } catch (error) {
    console.error('There was an error trying to unvouch your tokens.', error)
  }
}
