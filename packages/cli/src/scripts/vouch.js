import Kernel from '../models/Kernel'
import kernelAddress from '../utils/kernelAddress'

async function vouch(releaseAddress, rawAmount, { network, from }) {
  if(!releaseAddress) throw 'You must provide a release address to vouch for'
  if(!rawAmount) throw 'You must provide a vouching amount of ZEP tokens'
  const address = kernelAddress(network)
  const txParams = { from }

  const data = ''
  const amount = new web3.BigNumber(rawAmount)
  const kernel = new Kernel(address, txParams)
  await kernel.validateCanVouch(releaseAddress, amount)

  try {
    await kernel.vouch(releaseAddress, amount, data)
  } catch (error) {
    console.error('There was an error trying to vouch your tokens.', error)
  }
}

module.exports = vouch
