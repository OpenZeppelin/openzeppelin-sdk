import { promisify } from 'util'

export default async function getBalance(address) {
  let result = await promisify(web3.eth.getBalance.bind(web3.eth))(address);
  return +web3.fromWei(result.toNumber(), 'ether');
}
