module.exports = function(address) {
  if(!address) return false;
  if(address === '0x0000000000000000000000000000000000000000') return false;
  if(address.substring(0, 2) !== "0x") return false;
  if(!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;
  return true;
}
