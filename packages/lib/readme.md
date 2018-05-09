# zeppelin_os library
[![NPM Package](https://img.shields.io/npm/v/zos-lib.svg?style=flat-square)](https://www.npmjs.org/package/zos-lib)
[![Build Status](https://travis-ci.org/zeppelinos/zos-lib.svg?branch=master)](https://travis-ci.org/zeppelinos/zos-lib)
[![Coverage Status](https://coveralls.io/repos/github/zeppelinos/zos-lib/badge.svg?branch=master)](https://coveralls.io/github/zeppelinos/zos-lib?branch=master)

:warning: **Under heavy development: do not use in production** :warning: 

`zos-lib` is a library for writing upgradeable smart contracts on Ethereum. It can be used to create an upgradeable on-chain distributed application and is also used inside [the zOS Kernel](https://github.com/zeppelinos/kernel).

Use this library if you want to programmatically develop, deploy or operate an upgradeable smart contract system. 

If you want a CLI-aided development experience, see [the zOS CLI](https://github.com/zeppelinos/cli). 

# Getting Started

To install `zos-lib` simply go to your project's root directory and run:
```sh
npm i zos-lib
```

Next, learn how to:
- [Develop and deploy a single smart contract which can be upgraded](#single) (for bugfixing or adding new features).
- [Develop and operate a complex upgradeable app](#complex) with multiple smart contracts which are connected to the zOS Kernel upgradeable standard libraries.
- [Develop a zOS Kernel standard library release.](https://github.com/zeppelinos/kernel#developing-kernel-standard-libraries)

## <a name="single"></a> Develop and deploy a single upgradeable smart contract
Note: This shows a low-level manual method of developing a single upgradeable smart contract. You probably want to use [the higher-level CLI guide](https://github.com/zeppelinos/zos-cli/blob/master/README.md).

To work with a single upgradeable smart contract, you just need to deal with a simple upgradeability proxy. This is a special contract that will hold the storage of your upgradeable contract and redirect function calls to an `implementation` contract, which you can change (thus making it upgradeable). To learn more about how proxies work under the hood, [read this post on our blog](https://blog.zeppelinos.org/proxy-patterns/). To simply use them, do the following: 

1. Write the first implementation of your contract. Let's assume it's located in `MyContract.sol`. Most contracts require some sort of initialization, but upgradeable contracts can't use constructors ([for reasons explained in this blog post](https://blog.zeppelinos.org/proxy-patterns/)), so we need to use the `Initializable` pattern provided in `zos-lib`:

```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;
  
  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }
}
```

2. Deploy your first implementation contract:
```js
const implementation_v0 = await MyContract.new();
```
3. Now we need to deploy the proxy contract that will manage our contract's upgradeability. We pass the implementation address in the constructor, to set the first version of the behavior.

```js
const proxy = await OwnedUpgradeabilityProxy.new(implementation_v0.address);
```

4. Next, we call initialize on the proxy, to initialize the storage variables. Note that we wrap the proxy in a `MyContract` interface, because all calls will be delegated to the behavior.
```js
let myContract = await MyContract.at(proxy.address);
const x0 = 42;
await myContract.initialize(x0);
console.log(await myContract.x()); // 42
```

5. We now want to add a function to our contract, so we edit the MyContract.sol file and add it: 
```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;
  
  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }

  function y() public pure returns (uint256) {
    return 1337;  
  }

}
```

Note that when we update our contract's code, we can't change its pre-existing storage structure. This means we can't remove any previously existing contract variable. We can, however, remove functions we don't want to use anymore (in the code shown, all functions were preserved).

6. Next, we deploy the new implementation contract, and upgrade our proxy to it:
```js
const implementation_v1 = await MyContract.new();
await proxy.upgradeTo(implementation_v1.address);
myContract = await MyContract_v1.at(proxy.address);

console.log(await myContract.x()); // 42
console.log(await myContract.y()); // 1337

```

Wohoo! We've upgraded our contract's behavior while preserving it's storage.

For a fully working project with this example, see the [`examples/single`](https://github.com/zeppelinos/zos-lib/tree/master/examples/single) folder.

## <a name="complex"></a> Develop and operate a complex upgradeable app

Note: This shows a low-level manual method of developing a complex upgradeable smart contract application. You probably want to use [the higher-level CLI guide](https://github.com/zeppelinos/zos-cli/blob/master/README.md) instead, but feel free to continue reading if you want to understand the core contracts of `zos-lib`.

Most real-world applications require more than a single smart contract. Here's how to build a complex upgradeable app with multiple smart contracts and connect it to the zOS Kernel standard libraries.

Let's imagine we want to build a simple donation application where we give donors some sort of recognition.

An initial version of the contract can look like so:
```sol
pragma solidity ^0.4.21;

import "openzeppelin-zos/contracts/ownership/Ownable.sol";
import "openzeppelin-zos/contracts/math/SafeMath.sol";

contract DonationsV1 is Ownable {
  using SafeMath for uint256;

  // Keeps a mapping of total donor balances.
  mapping(address => uint256) public donorBalances;

  function donate() payable public {
    require(msg.value > 0);

    // Update user donation balance.
    donorBalances[msg.sender] = donorBalances[msg.sender].add(msg.value);
  }

  function getDonationBalance(address _donor) public view returns (uint256) {
    return donorBalances[_donor];
  }

  function withdraw(address _wallet) onlyOwner {

    // Withdraw all donated funds.
    _wallet.transfer(this.balance);
  }
}
```

We want to use `zos-lib` to deploy this contract with upgradeability capabilities. Given this will probably be a complex application and we'll want to use the zOS Kernel standard libraries, we'll use the `AppManager` programming interface.

The first step to do so is to create and configure the `AppManager` contract. This contract will live in the blockchain and manage the different versions of our smart contract code and upgradeability proxies. It's the single entry point to manage our application's contract's upgradeability and instances. Let's set it up:

```js
  // On-chain, single entry point of the entire application.
  log("<< Setting up AppManager >>")
  const initialVersion = '0.0.1'
  const appManager = AppManagerDeployer.call(initialVersion, txParams)
```

Next, we need to deploy the first version of the app contracts. To do so, we register the implementation of our `DonationsV1` in the `AppManager` and request it to create a new upgradeable proxy for it. Let's do it:
```js
  // Register the first implementation of "Basil", and request a proxy for it.
  log.info("<< Deploying version 1 >>")
  const DonationsV1 = ContractsProvider.getByName('DonationsV1')
  await appManager.setImplementation(DonationsV1, contractName);
  let donations = await appManager.createProxy(DonationsV1, contractName, 'initialize', [owner])
```

Now let's suppose we want to give some sort of retribution to people donating money to our donation campaign. We want to mint new ERC721 cryptocollectibles for every received donation. To do so, we'll link our application to a zOS Kernel standard library release that contains an implementation of a mintable ERC721 token. Here's the new contract code: 

```sol
pragma solidity ^0.4.21;

import "./DonationsV1.sol";
import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";

contract DonationsV2 is DonationsV1 {

  // Keeps track of the highest donation.
  uint256 public highestDonation;

  // ERC721 non-fungible tokens to be emitted on donations.
  MintableERC721Token public token;
  uint256 public numEmittedTokens;

  function setToken(MintableERC721Token _token) external onlyOwner {
    require(_token != address(0));
    require(token == address(0));
    token = _token;
  }

  function donate() payable public {
    super.donate();

    // Is this the highest donation?
    if(msg.value > highestDonation) {

      // Emit a token.
      token.mint(msg.sender, numEmittedTokens);
      numEmittedTokens++;

      highestDonation = msg.value;
    }
  }
}
```

What we need to do next is link our application to the zOS Kernel standard library release containing that mintable ERC721 implementation, and set it to our upgradeable contract. To do so, we create a new version of our application in the `AppManager`, register a new `AppDirectory` containing the new version of our contract implementation, and then set the standard library version of ERC721 to our upgradeable contract. Let's see how:

```js
  // Create a new version of the app, liked to the zeppelin_os standard library.
  // Register a new implementation for "Basil" and upgrade it's proxy to use the new implementation.
  log.info("<< Deploying version 2 >>")
  const secondVersion = '0.0.2'
  await appManager.newVersion(secondVersion, stdlib_ropsten)
  const DonationsV2 = ContractsProvider.getByName('DonationsV2')
  await appManager.setImplementation(DonationsV2, contractName);
  await appManager.upgradeProxy(donations.address, DonationsV1, contractName)
  donations = DonationsV2.at(donations.address);

  // Add an ERC721 token implementation to the project, request a proxy for it,
  // and set the token on "Basil".
  log.info(`Creating ERC721 token proxy to use in ${contractName}...`)
  const token = await appManager.createProxy(
    MintableERC721Token, 
    'MintableERC721Token', 
    'initialize'
    [donations.address, 'BasilToken', 'BSL']
  )
  log.info(`Token proxy created at ${token.address}`)
  log.info("Setting application's token...")
  await donations.setToken(token.address, txParams)
  log.info("Token set succesfully")
```

That's it! We now have the same contract, retaining the original balance, and storage, but with an upgraded code. The upgradeable contract is also linked to an on-chain upgradeable standard library containing an implementation of a mintable ERC721 token. State of the art!


## Develop a zOS Kernel standard library release
See [this guide in the zeppelinos/kernel repo](https://github.com/zeppelinos/kernel#developing-kernel-standard-libraries) to learn how to develop new zOS kernel standard library releases.
