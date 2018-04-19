import Kernel from '../models/Kernel'
import promptBoolean from '../utils/promptBoolean'

const BigNumber = web3.BigNumber
const { KERNEL_ADDRESS } = require('../utils/constants')

async function unvouch(releaseAddress, rawAmount, { from }) {
  const kernelAddress = KERNEL_ADDRESS
  const txParams = { from: from, gas: 6000000 }

  const data = ''
  const amount = new BigNumber(rawAmount)
  const kernel = new Kernel(kernelAddress, txParams)
  await kernel.validateCanUnvouch(releaseAddress, amount)

  promptBoolean(`Are you sure you want to unvouch ${amount} ZEP tokens from release ${releaseAddress}?`, async function () {
    try {
      await kernel.unvouch(releaseAddress, amount, data)
    } catch (error) {
      console.error('There was an error trying to unvouch your tokens.', error)
    }
  })
}

module.exports = unvouch