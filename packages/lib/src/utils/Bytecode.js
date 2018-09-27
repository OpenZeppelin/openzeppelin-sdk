'use strict'

import crypto from 'crypto'

export function bodyCode(instance) {
  return splitCode(instance).body
}

export function constructorCode(instance) {
  return splitCode(instance).constructor
}

export function bytecodeDigest(rawBytecode) {
  const bytecode = tryRemoveSwarmHash(rawBytecode.replace(/^0x/, ''))
  const buffer = Buffer.from(bytecode, 'hex')
  const hash = crypto.createHash('sha256')
  return hash.update(buffer).digest('hex')
}

// Removes the last 43 bytes of the bytecode, i.e., the swarm hash that the solidity compiler appends and that
// respects the following structure: 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes swarm hash> 0x00 0x29
// (see https://solidity.readthedocs.io/en/v0.4.24/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode)
export function tryRemoveSwarmHash(bytecode) {
  return bytecode.replace(/a165627a7a72305820[a-fA-F0-9]{64}0029$/, '')
}

function splitCode(instance) {
  const bytecode = instance.constructor.bytecode.replace(/^0x/, '')
  const body = instance.constructor.deployedBytecode.replace(/^0x/, '')
  const constructor = bytecode.substr(0, bytecode.indexOf(body))
  return { constructor, body }
}
