import BN from 'bignumber.js'
import ZWeb3 from './ZWeb3'
import decodeLogs from '../helpers/decodeLogs'
import { getSolidityLibNames, hasUnlinkedVariables } from '../utils/Bytecode'

export default class ContractFactory {
  constructor({ contractName, abi, ast, bytecode, deployedBytecode }, timeout, txParams) {
    this.abi = abi
    this.ast = ast
    this.bytecode = bytecode
    this.deployedBytecode = deployedBytecode
    this.contractName = contractName
    this.timeout = timeout
    this.txParams = txParams
    this._parseEvents()
    this._setBinaryIfPossible()
  }

  async new() {
    this._validateNonEmptyBinary()
    this._validateNonUnlinkedLibraries()

    const [args, txParams] = this._parseArguments(arguments)
    if (!txParams.data) txParams.data = this.binary
    const self = this

    return new Promise(function(resolve, reject) {
      const contractClass = ZWeb3.contract(self.abi)
      contractClass.new(...args, txParams, function(error, instance) {
        if (error) reject(error)
        else if(instance && instance.address) {
          const wrapper = self._wrapContract(instance)
          resolve(wrapper)
        }
      })
    })
  }

  at(address) {
    if(!ZWeb3.isAddress(address)) throw new Error("Given address is not valid: " + address)
    const contractClass = ZWeb3.contract(this.abi)
    const contract = contractClass.at(address)
    return this._wrapContract(contract)
  }

  getData(constructorArgs, txParams) {
    this._validateNonEmptyBinary()
    this._validateNonUnlinkedLibraries()
    const contractClass = ZWeb3.contract(this.abi)
    return contractClass.new.getData(...constructorArgs, { ...txParams, data: this.binary })
  }

  link(libraries) {
    Object.keys(libraries).forEach(name => {
      const address = libraries[name].replace(/^0x/, '')
      const regex = new RegExp(`__${name}_+`, 'g')
      this.binary = this.bytecode.replace(regex, address)
      this.deployedBinary = this.deployedBytecode.replace(regex, address)
    })
  }

  _wrapContract(contract) {
    const { address, transactionHash, allEvents } = contract
    const wrapper = { address, transactionHash, allEvents, constructor: this }
    this._promisifyABI(contract, wrapper)
    this._setSendFunctions(contract, wrapper)
    return wrapper
  }

  _setSendFunctions(instance, wrapper) {
    const self = this
    wrapper.sendTransaction = async function (txParams) {
      const tx = await ZWeb3.sendTransaction({ to: instance.address, ...self.txParams, ...txParams })
      const receipt = await ZWeb3.getTransactionReceiptWithTimeout(tx, self.timeout)
      return { tx, receipt, logs: decodeLogs(receipt.logs, self) }
    }
    wrapper.send = async function (value) {
      return wrapper.sendTransaction({ value: value })
    }
  }

  _promisifyABI(instance, wrapper) {
    instance.abi.filter(item => item.type === 'event').forEach(item => wrapper[item.name] = instance[item.name])
    instance.abi.filter(item => item.type === 'function').forEach(item => {
      wrapper[item.name] = item.constant
        ? this._promisifyFunction(instance[item.name], instance)
        : this._promisifyFunctionWithTimeout(instance[item.name], instance)
      wrapper[item.name].request = instance[item.name].request
      wrapper[item.name].call = this._promisifyFunction(instance[item.name].call, instance)
      wrapper[item.name].sendTransaction = this._promisifyFunction(instance[item.name].sendTransaction, instance)
      wrapper[item.name].estimateGas = this._promisifyFunction(instance[item.name].estimateGas, instance)
    })
  }

  _promisifyFunction(fn, instance) {
    const self = this
    return async function () {
      const [args, txParams] = self._parseArguments(arguments)
      return new Promise(function (resolve, reject) {
        args.push(txParams, function (error, result) {
          return error ? reject(error) : resolve(result)
        })
        fn.apply(instance, args)
      })
    }
  }

  _promisifyFunctionWithTimeout(fn, instance) {
    const self = this;
    return async function() {
      const [args, txParams] = self._parseArguments(arguments)
      return new Promise(function(resolve, reject) {
        args.push(txParams, function(error, tx) {
          return error ? reject(error) : ZWeb3.getTransactionReceiptWithTimeout(tx, self.timeout)
            .then(receipt => resolve({ tx, receipt, logs: decodeLogs(receipt.logs, self) }))
            .catch(reject)
        })
        fn.apply(instance, args)
      })
    }
  }

  _parseArguments(args) {
    const params = Array.prototype.slice.call(args)
    let givenTxParams = {}
    if(params.length > 0) {
      const lastArg = params[params.length - 1]
      if (typeof(lastArg) === 'object' && !Array.isArray(lastArg) && !BN.isBigNumber(lastArg)) givenTxParams = params.pop()
    }
    const txParams = { ...this.txParams, ...givenTxParams }
    return [params, txParams]
  }

  _parseEvents() {
    this.events = {}
    this.abi
      .filter(item => item.type === 'event')
      .forEach(event => {
        const signature = `${event.name}(${event.inputs.map(input => input.type).join(',')})`
        const topic = ZWeb3.sha3(signature)
        this.events[topic] = event
      })
  }

  _setBinaryIfPossible() {
    if(!hasUnlinkedVariables(this.bytecode)) {
      this.binary = this.bytecode
      this.deployedBinary = this.deployedBytecode
    }
  }

  _validateNonEmptyBinary() {
    if(this.bytecode === "") {
      throw new Error(`A bytecode must be provided for contract ${this.contractName}.`)
    }
  }

  _validateNonUnlinkedLibraries() {
    if(hasUnlinkedVariables(this.binary)) {
      const libraries = getSolidityLibNames(this.binary)
      throw new Error(`${this.contractName} bytecode contains unlinked libraries: ${libraries.join(', ')}`)
    }
  }
}
