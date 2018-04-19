import Kernel from '../models/Kernel'
import promptBoolean from '../utils/promptBoolean'
const { KERNEL_ADDRESS } = require('../utils/constants')

export default async function register(releaseAddress, { from }) {
  const kernelAddress = KERNEL_ADDRESS
  const txParams = { from: from, gas: 6000000 }

  const kernel = new Kernel(kernelAddress, txParams)
  await kernel.validateCanRegister(releaseAddress)
  const newVersionCost = await kernel.newVersionCost()

  promptBoolean(`To register a new version ${newVersionCost} ZEP tokens will be burned. Do you want to proceed?`, async function () {
    try {
      await kernel.register(releaseAddress)
    } catch (error) {
      console.error('There was an error trying to register your release.', error)
    }
  })
}
