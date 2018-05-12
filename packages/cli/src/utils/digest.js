import crypto from 'crypto';

export function bytecodeDigest(rawBytecode) {
  const bytecode = rawBytecode.replace(/^0x/, '')
  const buffer = Buffer.from(bytecode, 'hex')
  const hash = crypto.createHash('sha256')
  return hash.update(buffer).digest('hex')
}
