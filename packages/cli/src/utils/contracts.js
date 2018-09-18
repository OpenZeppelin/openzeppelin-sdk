'use strict'

import crypto from 'crypto'
import flatten from 'truffle-flattener'

export function bodyCode(instance) {
  return splitCode(instance).body
}

export function constructorCode(instance) {
  return splitCode(instance).constructor
}

export function bytecodeDigest(rawBytecode) {
  const bytecode = removeSwarmHash(rawBytecode.replace(/^0x/, ''))
  const buffer = Buffer.from(bytecode, 'hex')
  const hash = crypto.createHash('sha256')
  return hash.update(buffer).digest('hex')
}

export function flattenSourceCode(contract) {
  return flatten(contract)
}

function splitCode(instance) {
  const bytecode = instance.constructor.bytecode.replace(/^0x/, '')
  const body = instance.constructor.deployedBytecode.replace(/^0x/, '')
  const constructor = bytecode.substr(0, bytecode.indexOf(body))
  return { constructor, body }
}

function removeSwarmHash(bytecode) {
  return bytecode.replace(/a165627a7a72305820.*0029$/, '')
}
