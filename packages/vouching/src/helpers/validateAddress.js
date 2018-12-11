import ethjs from 'ethjs-util';

export default function validateAddress(address) {
  if (!address) return false
  if (address === '0x0000000000000000000000000000000000000000') return false
  if (address.substring(0, 2) !== "0x") return false

  // Basic validation: length, valid characters, etc
  if(!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false

  // Checksum validation.
  const raw = address.replace('0x','')
  const allLowerCase = raw.toLowerCase() === raw
  const allUppercase = raw.toUpperCase() === raw
  if(allLowerCase || allUppercase) {
    return true // accepts addreses with no checksum data
  }
  else {
    const checksum = ethjs.toChecksumAddress(address)
    if(address !== checksum) return false
  }

  return true
}
