import Kernel from '../models/Kernel'
import kernelAddress from '../utils/kernelAddress'

async function unvouch(releaseAddress, rawAmount, { network, from }) {
  if(!releaseAddress) throw new Error('You must provide a release address to unvouch from')
  if(!rawAmount) throw new Error('You must provide an amount of ZEP tokens to unvouch')
  const address = kernelAddress(network)
  const txParams = Object.assign({}, global.truffleDefaults, { from })

  const data = ''
  const amount = new web3.BigNumber(rawAmount)
  const kernel = new Kernel(address, txParams)
  await kernel.validateCanUnvouch(releaseAddress, amount)

  try {
    await kernel.unvouch(releaseAddress, amount, data)
  } catch (error) {
    console.error('There was an error trying to unvouch your tokens.', error)
  }
}

module.exports = unvouch
