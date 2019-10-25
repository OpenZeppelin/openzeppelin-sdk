export default async function getBalance(address) {
  let result = await web3.eth.getBalance(address);
  return +web3.utils.fromWei(result, 'ether');
}
