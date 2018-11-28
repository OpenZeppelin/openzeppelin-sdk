import * as ethjs from 'ethjs-util';

export default function validateAddress(address:string):boolean {
  if (!address) return false
  if (address === '0x0000000000000000000000000000000000000000') return false
  if (address.substring(0, 2) !== "0x") return false

  // Basic validation: length, valid characters, etc
  if(!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false

  // Checksum validation.
  const raw:string = address.replace('0x','')
  const allLowerCase:boolean = raw.toLowerCase() === raw
  const allUppercase:boolean = raw.toUpperCase() === raw
  if(allLowerCase || allUppercase) {
    return true // accepts addreses with no checksum data
  }
  else {
    const checksum:string = ethjs.toChecksumAddress(address)
    if(address !== checksum) return false
  }

  return true
}
