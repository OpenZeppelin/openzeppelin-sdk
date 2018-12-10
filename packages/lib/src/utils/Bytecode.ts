import crypto from 'crypto';
import { ZERO_ADDRESS } from './Addresses';

// TS-TODO: instance could probably be typed to some sort of web3 object - seems to be a contract.
export function bodyCode(instance: any): string {
  return splitCode(instance).body;
}

export function constructorCode(instance: any): string {
  return splitCode(instance).constructor;
}

export function bytecodeDigest(rawBytecode: string): string {
  const bytecode: string = tryRemoveSwarmHash(rawBytecode.replace(/^0x/, ''));
  const buffer: Buffer = Buffer.from(bytecode, 'hex');
  const hash: any = crypto.createHash('sha256');
  return hash.update(buffer).digest('hex');
}

// Retrieves libraries names in solidity bytecode. Note that if the placeholder does not estrictly match
// the format: __LibName__(...)__ it will fail to get the library names.
export function getSolidityLibNames(bytecode: string): string[] {
  const libs: string[] = bytecode.match(/__[A-Za-z0-9_]{36}__/g);
  return libs ? libs.map((lib: string) => lib.replace(/^__/, '').replace(/_*$/, '')) : [];
}

// Tells whether a bytecode has unlinked libraries or not
export function hasUnlinkedVariables(bytecode: string): boolean {
  return getSolidityLibNames(bytecode).length > 0;
}

// Removes the last 43 bytes of the bytecode, i.e., the swarm hash that the solidity compiler appends and that
// respects the following structure: 0xa1 0x65 'b' 'z' 'z' 'r' '0' 0x58 0x20 <32 bytes swarm hash> 0x00 0x29
// (see https://solidity.readthedocs.io/en/v0.4.24/metadata.html#encoding-of-the-metadata-hash-in-the-bytecode)
export function tryRemoveSwarmHash(bytecode: string): string {
  return bytecode.replace(/a165627a7a72305820[a-fA-F0-9]{64}0029$/, '');
}

// Replaces the solidity library address inside its bytecode with zeros
export function replaceSolidityLibAddress(bytecode: string, address: string): string {
  return bytecode.replace(address.replace(/^0x/, ''), ZERO_ADDRESS.replace(/^0x/, ''));
}

// Verifies if a bytecode represents a solidity library.
export function isSolidityLib(bytecode: string): boolean {
  const matches = bytecode.match(/^0x73[A-Fa-f0-9]{40}3014/);
  return matches == null ? false : matches.length > 0;
}

// TS-TODO: Define interface for returned object.
function splitCode(instance: any): {constructor: string, body: string} {
  const binary: string = instance.constructor.binary.replace(/^0x/, '');
  const bytecode: string = instance.constructor.bytecode.replace(/^0x/, '');
  const deployedBytecode: string = instance.constructor.deployedBytecode.replace(/^0x/, '');
  const constructor: string = bytecode.substr(0, bytecode.indexOf(deployedBytecode));
  const body: string = binary.replace(constructor, '');

  return { constructor, body };
}
