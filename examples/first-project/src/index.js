const Web3 = require('web3');

async function main() {
  const web3 = new Web3(process.env.PROVIDER_URL || 'http://localhost:8545');

  // Create web3 contract instance
  const address = '0xCfEB869F69431e42cdB54A4F4f105C19C080A601';
  const abi = require('../build/contracts/Counter.json').abi;
  const counter = new web3.eth.Contract(abi, address);

  // Retrieve accounts from the local node, we will use the first one to send the transaction
  const accounts = await web3.eth.getAccounts();

  // Send a transaction to increase() the Counter contract
  await counter.methods.increase(20)
    .send({ from: accounts[0], gas: 50000, gasPrice: 1e6 });

  // Call the value() function of the deployed Counter contract
  const value = await counter.methods.value().call();
  console.log(value);
}

if (require.main === module) {
  main();
}
