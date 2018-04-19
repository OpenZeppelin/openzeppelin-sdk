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

  async newVersionCost() {
    if(!this.newVersionCost) this.newVersionCost = await this.kernel.newVersionCost()
    return this.newVersionCost
  }

  async validateCanRegister(release) {
    await this._ifRegisteredThrow(release, `Given release ${release} must be frozen to be registered.`)
    await this._ifFrozenThrow(release, `Given release ${release} must be frozen to be registered.`)
    await this._ifNotEnoughBalanceToRegisterThrow(`You don't have enough ZEP tokens to register a new release.`)
  }

  async register(release) {
    const newVersionCost = await this.newVersionCost()
    console.log(`Approving ${newVersionCost} ZEP tokens to zOS kernel contract...`)
    const zepToken = await this.zepToken()
    await zepToken.approve(this.kernel.address, newVersionCost, this.txParams)
    console.log(`Registering release ${release}...`)
    await this.kernel.register(release, this.txParams)
  }

  async _ifRegisteredThrow(release, error) {
    const isRegistered = await this.kernel.isRegistered(release, this.txParams)
    if(isRegistered) throw new Error(error)
  }

  async _ifFrozenThrow(release, error) {
    const release = Release.at(release)
    const isFrozen = await release.frozen(this.txParams)
    if(!isFrozen) throw new Error(error)
  }

  async _ifNotEnoughBalanceToRegisterThrow(error) {
    const zepToken = await this.zepToken()
    const newVersionCost = await this.newVersionCost()
    const developerBalance = await zepToken.balanceOf(this.txParams.from, this.txParams)
    const doesNotHaveEnoughTokens = developerBalance.lt(newVersionCost)
    if(doesNotHaveEnoughTokens) throw new Error(error)
  }
}
