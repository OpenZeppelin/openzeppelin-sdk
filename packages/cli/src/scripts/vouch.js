import Kernel from '../models/Kernel'
import promptBoolean from '../utils/promptBoolean'

const BigNumber = web3.BigNumber
const { KERNEL_ADDRESS } = require('../utils/constants')

async function vouch(releaseAddress, rawAmount, { from }) {
  const kernelAddress = KERNEL_ADDRESS
  const txParams = { from: from, gas: 6000000 }

  const data = ''
  const amount = new BigNumber(rawAmount)
  const kernel = new Kernel(kernelAddress, txParams)
  await kernel.validateCanVouch(releaseAddress, amount)

  promptBoolean(`Are you sure you want to vouch ${amount} ZEP tokens for release ${releaseAddress}?`, async function () {
    try {
      await this.kernel.vouch(releaseAddress, amount, data)
    } catch (error) {
      console.error('There was an error trying to vouch your tokens.', error)
    }
  })
}

module.exports = vouch
