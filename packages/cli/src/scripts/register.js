import Kernel from '../models/Kernel'
import kernelAddress from '../utils/kernelAddress'

async function register(releaseAddress, { network, from }) {
  if(!releaseAddress) throw new Error('You must provide a release address')
  const address = kernelAddress(network)
  const txParams = { from }

  const kernel = new Kernel(address, txParams)
  await kernel.validateCanRegister(releaseAddress)

  try {
    await kernel.register(releaseAddress)
  } catch (error) {
    console.error('There was an error trying to register your release.', error)
  }
}

module.exports = register
