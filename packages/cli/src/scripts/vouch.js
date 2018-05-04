import { KernelProvider } from 'zos-kernel'

export default async function vouch({ releaseAddress, rawAmount, network, txParams = {} }) {
  if(!releaseAddress) throw 'You must provide a release address to vouch for'
  if(!rawAmount) throw 'You must provide a vouching amount of ZEP tokens'

  const data = ''
  const amount = new web3.BigNumber(rawAmount)
  const kernel = await KernelProvider.fromKernelNetworkFile(network, txParams)
  await kernel.validateCanVouch(releaseAddress, amount)

  try {
    await kernel.vouch(releaseAddress, amount, data)
  } catch (error) {
    console.error('There was an error trying to vouch your tokens.', error)
  }
}
