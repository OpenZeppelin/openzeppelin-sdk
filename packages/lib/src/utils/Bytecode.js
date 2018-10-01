'use strict'

import crypto from 'crypto'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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

// Retrieves libraries names in solidity bytecode. Note that if the placeholder does not estrictly match
// the format: __LibName__(...)__ it will fail to get the library names.
export function getSolidityLibNames(bytecode) {
  const libs = bytecode.match(/__[A-Za-z0-9_]{36}__/g)
  return libs ? libs.map(lib => lib.replace(/^__/, '').replace(/_*$/, '')) : []
}

// Removes the last 43 bytes of the bytecode, i.e., the swarm hash that the solidity compiler appends and that
// respects the following structure: 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes swarm hash> 0x00 0x29
// (see https://solidity.readthedocs.io/en/v0.4.24/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode)
export function tryRemoveSwarmHash(bytecode) {
  return bytecode.replace(/a165627a7a72305820[a-fA-F0-9]{64}0029$/, '')
}

// Replaces the solidity library address inside its bytecode with zeros
export function replaceSolidityLibAddress(bytecode, address) {
  return bytecode.replace(address.replace(/^0x/,''), ZERO_ADDRESS.replace(/^0x/, ''))
}

// Verifies if a bytecode represents a solidity library.
export function isSolidityLib(bytecode) {
  return bytecode.match(/^0x73[A-Fa-f0-9]{40}3014/)
}

function splitCode(instance) {
  const binary = instance.constructor.binary.replace(/^0x/, '')
  const bytecode = instance.constructor.bytecode.replace(/^0x/, '')
  const deployedBytecode = instance.constructor.deployedBytecode.replace(/^0x/, '')
  const constructor = bytecode.substr(0, bytecode.indexOf(deployedBytecode))
  const body = binary.replace(constructor, '')

  return { constructor, body }
}


