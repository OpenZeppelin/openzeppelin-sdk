import Logger from '../utils/Logger'

const log = new Logger('Kernel')
const makeContract = require('../utils/contract')
const Kernel = makeContract(require('zos-kernel/build/contracts/Kernel.json'))
const Release = makeContract(require('zos-kernel/build/contracts/Release.json'))
const ZepToken = makeContract(require('zos-kernel/build/contracts/ZepToken.json'))
const Vouching = makeContract(require('zos-kernel/build/contracts/Vouching.json'))

export default class KernelWrapper {
  constructor(address, txParams) {
    this.txParams = txParams
    this.kernel = Kernel.at(address)
  }

  async register(release) {
    const newVersionCost = await this.newVersionCost()
    log(`Approving ${newVersionCost} ZEP tokens to zOS kernel contract...`)
    const zepToken = await this.zepToken()
    await zepToken.approve(this.kernel.address, newVersionCost, this.txParams)
    log(`Registering release ${release}...`)
    const receipt = await this.kernel.register(release, this.txParams)
    log(`Release registered successfully. Transaction hash: ${receipt.tx}.`)
  }

  async vouch(release, amount, data = '') {
    log(`Approving ${amount} ZEP tokens to zOS kernel contract...`)
    const zepToken = await this.zepToken()
    await zepToken.approve(this.kernel.address, amount, this.txParams)
    log(`Vouching ${amount} ZEP tokens for release ${release}...`)
    const receipt = await this.kernel.vouch(release, amount, data, this.txParams)
    log(`Vouch processed successfully. Transaction hash: ${receipt.tx}.`)
  }

  async unvouch(release, amount, data = '') {
    log(`Unvouching ${amount} ZEP tokens from release ${release}...`)
    const receipt = await this.kernel.unvouch(release, amount, data, this.txParams)
    log(`Unvouch processed successfully. Transaction hash: ${receipt.tx}.`)
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
    if(isRegistered) throw error
  }

  async _ifNotRegisteredThrow(release, error) {
    const isRegistered = await this.kernel.isRegistered(release, this.txParams)
    if(!isRegistered) throw error
  }

  async _ifFrozenThrow(releaseAddress, error) {
    const release = Release.at(releaseAddress)
    const isFrozen = await release.frozen(this.txParams)
    if(!isFrozen) throw error
  }

  async _ifNotEnoughBalanceToRegisterThrow(error) {
    const zepToken = await this.zepToken()
    const newVersionCost = await this.newVersionCost()
    const developerBalance = await zepToken.balanceOf(this.txParams.from)
    const doesNotHaveEnoughTokens = developerBalance.lt(newVersionCost)
    if(doesNotHaveEnoughTokens) throw error
  }

  async _ifNotEnoughZepBalance(amount, error) {
    const zepToken = await this.zepToken()
    const voucherBalance = await zepToken.balanceOf(this.txParams.from)
    const doesNotHaveEnoughTokens = voucherBalance.lt(amount)
    if(doesNotHaveEnoughTokens) throw error
  }

  async _ifDoesNotReachPayout(amount, error) {
    const developerFraction = await this.kernel.developerFraction()
    const payout = amount.divToInt(developerFraction)
    if(payout <= 0) throw error
  }

  async _ifNotEnoughVouchThrow(release, amount, error) {
    const vouching = await this.vouching()
    const vouches = await vouching.vouchedFor(this.txParams.from, release)
    const doesNotHaveEnoughVouches = vouches.lt(amount)
    if(doesNotHaveEnoughVouches) throw error
  }

  async zepToken() {
    if(!this.zepTokenAddress) this.zepTokenAddress = await this.kernel.token()
    return ZepToken.at(this.zepTokenAddress)
  }

  async vouching() {
    if(!this.vouchingAddress) this.vouchingAddress = await this.kernel.vouches()
    return Vouching.at(this.vouchingAddress)
  }

  async newVersionCost() {
    if(!this.versionCost) this.versionCost = await this.kernel.newVersionCost()
    return this.versionCost
  }
}
