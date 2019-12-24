const Web3 = require('web3');
const { Contracts, ProxyAdminProject, ZWeb3 } = require('@openzeppelin/upgrades')

async function main(web3) {
  // Create web3 provider and initialize OpenZeppelin upgrades
  if (!web3) web3 = new Web3('http://localhost:8545');
  ZWeb3.initialize(web3.currentProvider)

  // Create an OpenZeppelin project
  const [from] = await ZWeb3.accounts();
  const project = new ProxyAdminProject('MyProject', null, null, { from, gas: 1e6, gasPrice: 1e9 });

  // Deploy an instance of MyContractV0
  log('Creating an upgradeable instance of v0...');
  const MyContractV0 = Contracts.getFromLocal('MyContractV0');
  const instance = await project.createProxy(MyContractV0, { initArgs: [42] });
  const address = instance.options.address;
  log(`Contract created at ${address}`);

  // And check its initial value
  const initialValue = await instance.methods.value().call();
  log(`Initial value is ${initialValue.toString()}\n`);

  // Upgrade it to V1
  log('Upgrading to v1...');
  const MyContractV1 = Contracts.getFromLocal('MyContractV1');
  const instanceV1 = await project.upgradeProxy(instance.options.address, MyContractV1);
  log(`Contract upgraded at ${instanceV1.options.address}`);

  // And check its new `add` method, note that we use instanceV1 since V0 has no `add` in its ABI
  await instanceV1.methods.add(10).send({ from, gas: 1e5, gasPrice: 1e9 });
  const newValue = await instance.methods.value().call();
  log(`Updated value is ${newValue.toString()}\n`);

  return instanceV1;
}

// Logging
function log() {
  if (process.env.NODE_ENV !== 'test') {
    console.log.apply(this, arguments)
  }
}

// Testing
module.exports.main = main;

// Running
if (require.main === module) {
  main();
}