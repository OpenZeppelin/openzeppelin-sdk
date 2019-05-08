const { ConfigVariablesInitializer, files, scripts, stdout } = require('zos');
const { helpers, Contracts } = require('zos-lib');
stdout.silent(true);

async function setup(network) {
  // Initialize network
  const networkConfig = await ConfigVariablesInitializer.initNetworkConfiguration({ network: network || process.env.NETWORK || 'local' });
  console.log(`$ zos session --network ${networkConfig.network}`);
  console.log(`> Initialized session on network ${networkConfig.network}\n`);

  return networkConfig;
}

async function push(networkConfig) {
  // Push contracts to the network
  await scripts.push({ deployProxyAdmin: true, ...networkConfig });
  console.log(`$ zos push`)
  console.log(`> Pushed logic contract to the network\n`)
}

async function useCreate2(initValue, networkConfig) {
  // Calculate reserved address for a salt for the current sender
  const salt = parseInt(Math.random() * 1000);
  const address = await scripts.queryDeployment({ salt, ...networkConfig });
  console.log(`$ zos create2 --salt ${salt}`);
  console.log(`> Instance using salt ${salt} will be deployed at ${address}\n`)

  // Actually deploy it!
  const instance = await scripts.create({ salt, contractAlias: 'Sample', methodName: 'initialize', methodArgs: [initValue], ...networkConfig });
  const value = await instance.methods.value().call();
  console.log(`$ zos create2 Sample --salt ${salt} --init --args ${initValue}`);
  console.log(`> Instance deployed at ${instance.options.address} with value ${value}\n`);
  if (value != initValue.toString()) throw new Error(`Expected value ${initValue} but got ${value}`);

  return instance;
}


async function useSignedCreate2(initValue, networkConfig) {    
  // Let's now sign a deployment instead of running it ourselves
  const signer = '0x239938d1Bd73e99a5042d29DcFFf6991e0Fe5626';
  const signerPk = '0xbe7e12ce20410c5f0207bd6c7bcae39052679bfd401c62849657ebfe23e3711b';
  const salt = parseInt(Math.random() * 1000);

  // Calculate initialization raw data
  const Sample = Contracts.getFromLocal('Sample');
  const initData = Sample.methods.initialize(initValue).encodeABI();

  // We will use the project's proxy admin as upgradeability admin of this instance
  const networkFile = new files.ZosPackageFile().networkFile(networkConfig.network);
  const admin = networkFile.proxyAdminAddress;

  // And will use the current implementation for Sample as logic contract
  const logic = networkFile.contract('Sample').address;

  // We now ask zos-lib to sign the request for us
  const signature = helpers.signDeploy(networkFile.proxyFactoryAddress, salt, logic, admin, initData, signerPk);
  
  // Query the deployment address for that signature
  const createArgs = { salt, contractAlias: "Sample", methodName: "initialize", methodArgs: [initValue] };
  const address = await scripts.querySignedDeployment({ signature, ... createArgs, ... networkConfig });
  console.log(`$ zos create2 Sample --query --salt ${salt} --signature ${signature} --init --args ${initValue}`);
  console.log(`> Instance of Sample initialized with 'initialize(${initValue})' with salt ${salt} and signature ${signature} will be deployed at ${address}\n`);

  // And deploy!
  const instance = await scripts.create({ signature, ... createArgs, ... networkConfig });
  const value = await instance.methods.value().call();
  console.log(`$ zos create2 Sample --salt ${salt} --signature ${signature} --init --args ${initValue}`);
  console.log(`> Instance deployed at ${instance.options.address} with value ${value} using signature ${signature}\n`);
  if (value != initValue.toString()) throw new Error(`Expected value ${initValue} but got ${value}`);

  return instance;
}

async function main() {
  const networkConfig = await setup();
  await push(networkConfig);
  await useCreate2(10, networkConfig);
  await useSignedCreate2(20, networkConfig);
}

module.exports = function(cb) {
  main().then(() => cb()).catch(cb);
}

module.exports.setup = setup;
module.exports.push = push;
module.exports.useCreate2 = useCreate2;
module.exports.useSignedCreate2 = useSignedCreate2;
