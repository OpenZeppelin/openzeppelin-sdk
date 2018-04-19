const BigNumber = web3.BigNumber
const contract = require("truffle-contract")
const promptBoolean = require('../utils/promptBoolean')
const KERNEL_ADDRESS = require('../utils/constants').KERNEL_ADDRESS
const ZEP_TOKEN_ADDRESS = require('../utils/constants').ZEP_TOKEN_ADDRESS

async function vouch() {
  const data = ''
  const amount = new BigNumber(10)

  const releaseAddress = '0x575c467d94f0abde1bca0d529eb233fd5f27d0b4'
  const voucher = web3.eth.accounts[2]

  const Kernel = contract(require('zos-kernel/build/contracts/Kernel.json'))
  Kernel.setProvider(web3.currentProvider)
  const kernel = Kernel.at(KERNEL_ADDRESS)

  const ZepToken = contract(require('zos-kernel/build/contracts/ZepToken.json'))
  ZepToken.setProvider(web3.currentProvider)
  const zepToken = ZepToken.at(ZEP_TOKEN_ADDRESS)

  const txParams = { from: voucher, gas: 6000000  }

  const isRegistered = await kernel.isRegistered(releaseAddress, txParams)
  if(!isRegistered) {
    console.error(`Given release ${releaseAddress} is not registered yet.`)
    return
  }

  const voucherBalance = await zepToken.balanceOf(voucher, txParams)
  const doesNotHaveEnoughTokens = voucherBalance.lt(amount)
  if(doesNotHaveEnoughTokens) {
    console.error("You don't have enough ZEP tokens to vouch given amount.")
    return
  }

  const developerFraction = await kernel.developerFraction(txParams)
  const payout = amount.divToInt(developerFraction)
  if(payout <= 0) {
    console.error(`You have to vouch ${developerFraction} ZEP tokens at least.`)
    return
  }

  promptBoolean(`Are you sure you want to vouch ${amount} ZEP tokens for release ${releaseAddress}?`, async function () {
    try {
      console.log(`Approving ${amount} ZEP tokens to zOS kernel contract...`)
      await zepToken.approve(KERNEL_ADDRESS, amount, txParams)
      console.log(`Vouching ${amount} ZEP tokens for release ${releaseAddress}...`)
      const receipt = await kernel.vouch(releaseAddress, amount, data, txParams)
      console.log(`Vouch processed successfully. Transaction hash: ${receipt.transactionHash}.`)
    } catch (error) {
      console.error('There was an error trying to vouch your tokens.', error)
    }
  })
}

module.exports = function(cb) {
  vouch().then(cb).catch(cb)
}
