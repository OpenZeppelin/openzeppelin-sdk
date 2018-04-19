const contract = require("truffle-contract")
const Kernel = contract(require('zos-kernel/build/contracts/Kernel.json'))
const Release = contract(require('zos-kernel/build/contracts/Release.json'))
const ZepToken = contract(require('zos-kernel/build/contracts/ZepToken.json'))
const Vouching = contract(require('zos-kernel/build/contracts/Vouching.json'))

Kernel.setProvider(web3.currentProvider)
Release.setProvider(web3.currentProvider)
ZepToken.setProvider(web3.currentProvider)
Vouching.setProvider(web3.currentProvider)

export default class KernelWrapper {
  constructor(address, txParams) {
    this.txParams = txParams
    this.kernel = Kernel.at(address)
  }

  async zepToken() {
    if(!this.zepToken) this.zepToken = ZepToken.at(await this.kernel.zepToken())
    return this.zepToken
  }

  async vouching() {
    if(!this.vouching) this.vouching = Vouching.at(await this.kernel.vouches())
    return this.vouching
  }

  async newVersionCost() {
    if(!this.newVersionCost) this.newVersionCost = await this.kernel.newVersionCost()
    return this.newVersionCost
  }

  async register(release) {
    const newVersionCost = await this.newVersionCost()
    console.log(`Approving ${newVersionCost} ZEP tokens to zOS kernel contract...`)
    const zepToken = await this.zepToken()
    await zepToken.approve(this.kernel.address, newVersionCost, this.txParams)
    console.log(`Registering release ${release}...`)
    const receipt = await this.kernel.register(release, this.txParams)
    console.log(`Release registered successfully. Transaction hash: ${receipt.tx}.`)
  }

  async vouch(release, amount, data = '') {
    console.log(`Approving ${amount} ZEP tokens to zOS kernel contract...`)
    const zepToken = await this.zepToken()
    await zepToken.approve(this.kernel.address, amount, this.txParams)
    console.log(`Vouching ${amount} ZEP tokens for release ${release}...`)
    const receipt = await this.kernel.vouch(release, amount, data, this.txParams)
    console.log(`Vouch processed successfully. Transaction hash: ${receipt.tx}.`)
  }

  async unvouch(release, amount, data = '') {
    console.log(`Unvouching ${amount} ZEP tokens from release ${release}...`)
    const receipt = await this.kernel.unvouch(release, amount, data, this.txParams)
    console.log(`Unvouch processed successfully. Transaction hash: ${receipt.tx}.`)
  }

  async validateCanRegister(release) {
    await this._ifRegisteredThrow(release, `Given release ${release} must be frozen to be registered.`)
    await this._ifFrozenThrow(release, `Given release ${release} must be frozen to be registered.`)
    await this._ifNotEnoughBalanceToRegisterThrow(`You don't have enough ZEP tokens to register a new release.`)
  }

  async validateCanVouch(release, amount) {
    await this._ifNotRegisteredThrow(release, `Given release ${release} is not registered yet.`)
    await this._ifNotEnoughZepBalance(amount, "You don't have enough ZEP tokens to vouch given amount.")
    await this._ifDoesNotReachPayout(amount, `You have to vouch ${await this.kernel.developerFraction()} ZEP tokens at least.`)
  }

  async validateCanUnvouch(release, amount) {
    await this._ifNotRegisteredThrow(release, `Given release ${release} is not registered yet.`)
    await this._ifNotEnoughVouchThrow(release, amount, "You don't have enough vouched tokens to unvouch given amount.")
  }

  async _ifRegisteredThrow(release, error) {
    const isRegistered = await this.kernel.isRegistered(release, this.txParams)
    if(isRegistered) throw new Error(error)
  }

  async _ifNotRegisteredThrow(release, error) {
    const isRegistered = await this.kernel.isRegistered(release, this.txParams)
    if(!isRegistered) throw new Error(error)
  }

  async _ifFrozenThrow(release, error) {
    const release = Release.at(release)
    const isFrozen = await release.frozen(this.txParams)
    if(!isFrozen) throw new Error(error)
  }

  async _ifNotEnoughBalanceToRegisterThrow(error) {
    const zepToken = await this.zepToken()
    const newVersionCost = await this.newVersionCost()
    const developerBalance = await zepToken.balanceOf(this.txParams.from)
    const doesNotHaveEnoughTokens = developerBalance.lt(newVersionCost)
    if(doesNotHaveEnoughTokens) throw new Error(error)
  }

  async _ifNotEnoughZepBalance(amount, error) {
    const zepToken = await this.zepToken()
    const voucherBalance = await zepToken.balanceOf(this.txParams.from)
    const doesNotHaveEnoughTokens = voucherBalance.lt(amount)
    if(doesNotHaveEnoughTokens) throw new Error(error)
  }

  async _ifDoesNotReachPayout(amount, error) {
    const developerFraction = await this.kernel.developerFraction()
    const payout = amount.divToInt(developerFraction)
    if(payout <= 0) throw new Error(error)
  }

  async _ifNotEnoughVouchThrow(release, amount, error) {
    const vouching = await this.vouching()
    const vouches = await vouching.vouchedFor(this.txParams.from, release)
    const doesNotHaveEnoughVouches = vouches.lt(amount)
    if(doesNotHaveEnoughVouches) throw new Error(error)
  }
}
