import crypto from 'crypto';

export function bytecodeDigest(bytecode) {
  return crypto.createHash('sha256').update(Buffer.from(bytecode, 'hex')).digest('hex');
}