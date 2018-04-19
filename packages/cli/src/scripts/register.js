const contract = require("truffle-contract")
const promptBoolean = require('../utils/promptBoolean')
const KERNEL_ADDRESS = require('../utils/constants').KERNEL_ADDRESS
const ZEP_TOKEN_ADDRESS = require('../utils/constants').ZEP_TOKEN_ADDRESS

async function register() {
  const releaseAddress = '0x575c467d94f0abde1bca0d529eb233fd5f27d0b4'
  const developerAddress = web3.eth.accounts[2]

  const Kernel = contract(require('zos-kernel/build/contracts/Kernel.json'))
  Kernel.setProvider(web3.currentProvider)
  const kernel = Kernel.at(KERNEL_ADDRESS)

  const Release = contract(require('zos-kernel/build/contracts/Release.json'))
  Release.setProvider(web3.currentProvider)
  const release = Release.at(releaseAddress)

  const ZepToken = contract(require('zos-kernel/build/contracts/ZepToken.json'))
  ZepToken.setProvider(web3.currentProvider)
  const zepToken = ZepToken.at(ZEP_TOKEN_ADDRESS)

  const txParams = { from: developerAddress, gas: 6000000 }

  const isRegistered = await kernel.isRegistered(releaseAddress, txParams)
  if(isRegistered) {
    console.error(`Given release ${releaseAddress} is already registered.`)
    return
  }

  const isFrozen = await release.frozen(txParams)
  if(!isFrozen) {
    console.error(`Given release ${releaseAddress} must be frozen to be registered.`)
    return
  }

  const newVersionCost = await kernel.newVersionCost(txParams)
  const developerBalance = await zepToken.balanceOf(developerAddress, txParams)
  const doesNotHaveEnoughTokens = developerBalance.lt(newVersionCost)
  if(doesNotHaveEnoughTokens) {
    console.error("You don't have enough ZEP tokens to register this release.")
    console.error(`To register a new version you need ${newVersionCost} ZEP tokens at least.`)
    return
  }

  promptBoolean(`To register a new version ${newVersionCost} ZEP tokens will be burned. Do you want to proceed?`, async function () {
    try {
      console.log(`Approving ${newVersionCost} ZEP tokens to zOS kernel contract...`)
      await zepToken.approve(KERNEL_ADDRESS, newVersionCost, txParams)
      console.log(`Registering release ${releaseAddress}...`)

      const receipt = await kernel.register(releaseAddress, txParams)
      console.log(receipt)
      console.log(`Release registered successfully. Transaction hash: ${receipt.tx}.`)
    } catch (error) {
      console.error('There was an error trying to register your release.', error)
    }
  })
}

module.exports = function(cb) {
  register().then(cb).catch(cb)
}
