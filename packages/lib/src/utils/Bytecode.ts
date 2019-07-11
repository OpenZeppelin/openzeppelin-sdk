import crypto from 'crypto';
import { ZERO_ADDRESS } from './Addresses';
import Contract from '../artifacts/Contract';
import cbor from 'cbor';
import { Loggy } from '../utils/Logger';

export function bodyCode(contract: Contract): string {
  return splitCode(contract).body;
}

export function constructorCode(contract: Contract): string {
  return splitCode(contract).constructor;
}

export function bytecodeDigest(rawBytecode: string): string {
  const bytecode: string = tryRemoveMetadata(rawBytecode.replace(/^0x/, ''));
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

// Removes the swarm hash from the CBOR encoded metadata at the end of the bytecode
// (see https://solidity.readthedocs.io/en/v0.5.9/metadata.html)
export function tryRemoveMetadata(bytecode: string): string {
  // Bail on empty bytecode
  if (!bytecode || bytecode.length <= 2) return bytecode;

  // Gather length of CBOR metadata from the end of the file
  const rawLength = bytecode.slice(bytecode.length - 4);
  const length = parseInt(rawLength, 16);

  // Bail on unreasonable values for length (meaning we read something else other than metadata length)
  if (length * 2 > bytecode.length - 4) return bytecode;

  // Gather what we assume is the CBOR encoded metadata, and try to parse it
  const metadataStart = bytecode.length - length * 2 - 4;
  const metadata = bytecode.slice(metadataStart, bytecode.length - 4);

  // Parse it to see if it is indeed valid metadata
  try {
    cbor.decode(Buffer.from(metadata, 'hex'));
  } catch (err) {
    Loggy.noSpin.warn(
      __filename,
      'tryRemoveMetadata',
      'parse-contract-metadata',
      `Error parsing contract metadata: ${err.message}. Ignoring.`,
    );

    return bytecode;
  }

  // Return bytecode without it
  return bytecode.slice(0, metadataStart);
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

function splitCode(contract: Contract): { constructor: string; body: string } {
  const binary = contract.schema.linkedBytecode.replace(/^0x/, '');
  const bytecode = contract.schema.bytecode.replace(/^0x/, '');
  const deployedBytecode = contract.schema.deployedBytecode.replace(/^0x/, '');
  const constructor = bytecode.substr(0, bytecode.indexOf(deployedBytecode));
  const body = binary.replace(constructor, '');
  return { constructor, body };
}
